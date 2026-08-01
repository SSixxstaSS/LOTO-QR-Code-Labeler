// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod printing;
use reqwest;
use base64::{engine::general_purpose::STANDARD, Engine};
use serde_json::json;



#[tauri::command]
async fn get_qr(url: String) -> Result<String, String> {
    let config = json!({
        "body": "circle-zebra-vertical",
        "eye": "frame2",
        "eyeBall": "ball2",
        "erf1": ["fv"],
        "erf2": [],
        "erf3": [],
        "brf1": ["fv"],
        "brf2": [],
        "brf3": [],
        "bodyColor": "#449adc",
        "bgColor": "#FFFFFF",
        "eye1Color": "#449adc",
        "eye2Color": "#449adc",
        "eye3Color": "#449adc",
        "eyeBall1Color": "#449adc",
        "eyeBall2Color": "#449adc",
        "eyeBall3Color": "#449adc",
        "gradientColor1": "",
        "gradientColor2": "",
        "gradientType": "linear",
        "gradientOnEyes": "true",
        "logo": "51da3ea38bc85b566ea2d00d9c7a5efb5110f2f7.png",
        "logoMode": "default"
    });

    let config_str = config.to_string();

    let response = reqwest::Client::new()
        .get("https://api.qrcode-monkey.com/qr/custom")
        .query(&[
            ("file", "png"),
            ("data", url.as_str()),
            ("size", "1000"),
            ("config", config_str.as_str()),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("QR API returned {}", response.status()));
    }

    let image_bytes = response.bytes().await.map_err(|e| e.to_string())?;

    Ok(format!("data:image/png;base64,{}", STANDARD.encode(&image_bytes)))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            printing::list_printers,
            printing::print_label_sheet,
            printing::render_label_sheet_pdf,
            get_qr
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
