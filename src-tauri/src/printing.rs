// Windows printing pipeline: one HTML document per page -> one PDF per page
// (headless Edge) -> one silent print job per page (SumatraPDF).
//
// Rendering a page at a time means Blink never paginates, so CSS transforms
// inside the sheet are never handed to the fragmenter.




use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Manager};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;


use serde::Serialize;
use tauri::Emitter;

#[derive(Clone, Serialize)]
struct PrintProgress {
    phase: &'static str,   // "rendering" | "printing" | "done"
    current: usize,
    total: usize,
}

fn emit(app: &AppHandle, phase: &'static str, current: usize, total: usize) {
    let _ = app.emit("print-progress", PrintProgress { phase, current, total });
}


// ---------------------------------------------------------------- helpers --

fn no_window(cmd: &mut Command) -> &mut Command {
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

fn edge_path() -> Result<PathBuf, String> {
    let mut candidates: Vec<PathBuf> = vec![
        PathBuf::from(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        PathBuf::from(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    ];

    if let Ok(local) = env::var("LOCALAPPDATA") {
        candidates.push(PathBuf::from(local).join(r"Microsoft\Edge\Application\msedge.exe"));
    }

    candidates
        .into_iter()
        .find(|p| p.exists())
        .ok_or_else(|| "Microsoft Edge was not found on this machine.".to_string())
}

fn sumatra_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(res) = app.path().resource_dir() {
        candidates.push(res.join("bin").join("sm.exe"));
        candidates.push(res.join("sm.exe"));
    }

    if let Ok(exe) = env::current_exe() {
        if let Some(dir) = exe.parent() {
            candidates.push(dir.join("bin").join("sm.exe"));
            candidates.push(dir.join("sm.exe"));
        }
    }

    candidates
        .into_iter()
        .find(|p| p.exists())
        .ok_or_else(|| "sm.exe (SumatraPDF) was not found in the app resources.".to_string())
}

fn job_dir() -> Result<PathBuf, String> {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();

    let dir = env::temp_dir().join(format!("loto_print_{}_{}", std::process::id(), stamp));
    fs::create_dir_all(&dir).map_err(|e| format!("Could not create temp dir: {e}"))?;
    Ok(dir)
}

// --------------------------------------------------------------- commands --

/// Returns the raw JSON from `Get-Printer`. PowerShell emits a bare object
/// rather than an array when exactly one printer is installed.
#[tauri::command]
pub async fn list_printers() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let script = "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
                      Get-Printer | Select-Object Name, PortName, PrinterStatus \
                      | ConvertTo-Json -Compress";

        let output = no_window(&mut Command::new("powershell"))
            .args(["-NoProfile", "-NonInteractive", "-Command", script])
            .output()
            .map_err(|e| format!("Could not run PowerShell: {e}"))?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Takes one complete HTML document per page. Each is rendered separately and
/// printed as its own job, in order.
#[tauri::command]
pub async fn print_label_sheet(
    app: AppHandle,
    pages: Vec<String>,
    printer: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || run_job(&app, pages, printer))
        .await
        .map_err(|e| e.to_string())?
}




/// Renders without printing. Returns one PDF path per page, kept on disk so you
/// can check registration before committing label stock.
#[tauri::command]
pub async fn render_label_sheet_pdf(
    app: AppHandle,
    pages: Vec<String>,
) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = job_dir()?;
        let mut out = Vec::new();

        for (i, html) in pages.iter().enumerate() {
            let pdf = render_pdf(html, &dir, i)?;
            out.push(pdf.to_string_lossy().to_string());
        }

        Ok(out)
    })
    .await
    .map_err(|e| e.to_string())?
}

// ------------------------------------------------------------------ steps --

fn render_pdf(html: &str, dir: &Path, index: usize) -> Result<PathBuf, String> {
    let html_path = dir.join(format!("sheet_{index}.html"));
    let pdf_path = dir.join(format!("sheet_{index}.pdf"));
    // Shared across pages: reused sequentially, and building it once per job
    // rather than once per page saves a noticeable amount of startup time.
    let profile = dir.join("profile");

    fs::write(&html_path, html).map_err(|e| format!("Could not write page {index}: {e}"))?;

    let url = format!(
        "file:///{}",
        html_path.to_string_lossy().replace('\\', "/")
    );



    let output = no_window(&mut Command::new(edge_path()?))
        .args([
            "--headless=new",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
            // Required: without a private profile this silently does nothing
            // whenever the user already has Edge open.
            &format!("--user-data-dir={}", profile.to_string_lossy()),
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=10000",
            &format!("--print-to-pdf={}", pdf_path.to_string_lossy()),
            &url,
        ])
        .output()
        .map_err(|e| format!("Could not run Edge: {e}"))?;

    if !pdf_path.exists() {
        return Err(format!(
            "Edge did not produce a PDF for page {} (exit {}).\n{}",
            index + 1,
            output.status.code().unwrap_or(-1),
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(pdf_path)
}

fn print_pdf(app: &AppHandle, pdf_path: &Path, printer: &str) -> Result<(), String> {
    let output = no_window(&mut Command::new(sumatra_path(app)?))
        .args([
            "-print-to",
            printer,
            "-print-settings",
            "noscale",
            "-silent",
            "-exit-when-done",
            &pdf_path.to_string_lossy(),
        ])
        .output()
        .map_err(|e| format!("Could not run SumatraPDF: {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "Printing failed (exit {}).\n{}",
            output.status.code().unwrap_or(-1),
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(())
}




fn run_job(app: &AppHandle, pages: Vec<String>, printer: String) -> Result<(), String> {
    if printer.trim().is_empty() {
        return Err("No printer selected.".to_string());
    }
    if pages.is_empty() {
        return Err("Nothing to print.".to_string());
    }

    let total = pages.len();
    let dir = job_dir()?;

    let result = (|| {
        let mut pdfs = Vec::new();
        for (i, html) in pages.iter().enumerate() {
            pdfs.push(render_pdf(html, &dir, i)?);
            emit(app, "rendering", i + 1, total);
        }

        for (i, pdf) in pdfs.iter().enumerate() {
            print_pdf(app, pdf, &printer)?;
            emit(app, "printing", i + 1, total);
        }

        emit(app, "done", total, total);
        Ok(())
    })();

    let _ = fs::remove_dir_all(&dir);
    result
}
