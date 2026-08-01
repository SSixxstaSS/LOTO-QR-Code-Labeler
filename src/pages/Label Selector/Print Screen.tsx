import React from "react";
import {AnimatePresence, motion} from "framer-motion";
import Loading from "../../components/Loading.tsx";
import EEGlobal from "../../util/Event Emitter.ts";
import {invoke} from "@tauri-apps/api/core";
import {DotLottieReact} from "@lottiefiles/dotlottie-react";
import {listen} from "@tauri-apps/api/event";




const toBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const blob = await res.blob();

    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error(`Unexpected reader result for ${url}`));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
};


type PrintProgress = {
    phase: string; current: number; total: number;
} | null

const PrintScreen = (
    {  selectedLabels, disabledStickers }:{ selectedLabels:{name:string, type:string, count:number, url:string}[], disabledStickers:boolean[] }
) => {

    const [printingProgress, setPrintingProgress] = React.useState<PrintProgress>(null);
    const [qrCodeRenderProgress, setQrCodeRenderProgress] = React.useState<{ inc:number, tot:number }|null>(null)

    const [printers, setPrinters] = React.useState<string[]>([])
    const [selectedPrinter, setSelectedPrinter] = React.useState<string|null>(null)
    const [printersLoading, setPrintersLoading] = React.useState<boolean>(false)
    const [printRenderingLoading, setPrintRenderingLoading] = React.useState<boolean>(false)
    const [printingUI, setPrintingUI] = React.useState<boolean>(false)


    React.useEffect(() => {
        (async () => {
            setPrintersLoading(true)
            const raw = JSON.parse(await invoke<string>("list_printers"));
            setPrinters((Array.isArray(raw) ? raw : [raw]).map((p: any) => p.Name));
            setPrintersLoading(false)

        })()
    }, [])


    React.useEffect(() => {
        const un = listen<typeof printingProgress>("print-progress", e => setPrintingProgress(e.payload));
        return () => { un.then(f => f()); };
    }, []);


    React.useEffect(() => {

        const onSetQrCodeRenderingProgress = (prog:{ inc:number, tot:number }) => {
            setQrCodeRenderProgress(prog)
        }

        EEGlobal.addListener("setQrCodeRenderingProgress", onSetQrCodeRenderingProgress)
        return () => {
            EEGlobal.removeListener("setQrCodeRenderingProgress", onSetQrCodeRenderingProgress)
        }
    }, [])

    const onPrint = async () => {
        if (!selectedPrinter) return;

        setPrintRenderingLoading(true)

        const formattedLabels = selectedLabels.flatMap(label=>Array.from({length:label.count}, () => ({name:label.name, type:label.type, url:label.url})))
        const pages = await getPages(formattedLabels, disabledStickers);





        setPrintRenderingLoading(false)
        setPrintingUI(true)

        try {
            await invoke("print_label_sheet", { pages, printer: selectedPrinter });
        } catch (error) { console.error(error); }


        setPrintingUI(false)
        setPrintingProgress(null)
        setQrCodeRenderProgress(null)
    }




    return (
        <motion.div

            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}

            className="w-screen h-screen absolute left-0 top-0 z-[200] flex items-center justify-center "
        >
            <motion.div
                // radius={30}
                // color={"black"}
                // chromaticAberration={2}
                // strength={100}
                // depth={10}
                // blur={2}

                initial={{ y:100}}
                animate={{y: 0}}
                exit={{y: -100}}

                className="max-h-[95%] aspect-[0.95] bg-[#000]/25 relative backdrop-blur-[15px] rounded-[30px] border-solid border-[1px] border-[#5C5C5C] relative overflow-hidden"
                style={{
                    width: "clamp(0px, 95%, 800px)",
                }}
            >

                <motion.div
                    initial={{ x:'100%' }}
                    animate={{ x:printingUI?"0%":"100%" }}
                    exit={{ x:"100%" }}

                    className={"w-full h-full absolute left-0 top-0 z-100 "}
                ><PrintingScreen printingProgress={printingProgress}/></motion.div>



                <motion.div
                    initial={{ x:'0%' }}
                    animate={{ x:printingUI?"-100%":"0%" }}
                    exit={{ x:"0%" }}

                    className={"w-full h-full relative left-0 top-0 p-[20px_30px] overflow-hidden"}
                >

                    {/*Header*/}
                    <div
                        className={"flex w-full items-center justify-between"}
                    >
                        <p
                            className={"text-[1.8em] font-bold"}
                        >Print Labels</p>

                        <motion.img

                            whileHover={{ scale:1.1 }}
                            whileTap={{ scale:0.9 }}

                            onClick={() => EEGlobal.emit("togglePrintUI",false)}

                            className={"w-[20px] cursor-pointer"}
                            src={'/assets/x.png'}
                        />
                    </div>

                    <div
                        className={"w-full h-full overflow-auto pb-[30px]"}
                    >

                        {/*Print Button*/}

                        <AnimatePresence>
                            {selectedPrinter&& (
                                <motion.div

                                    initial={{ scale:0 }}
                                    animate={{ scale:1 }}
                                    exit={{ scale:0 }}

                                    className={`absolute right-[10px] bottom-[10px] bg-[#242424] flex gap-[15px] p-[10px] rounded-[100px] items-center aspect-[1] cursor-pointer z-20`}
                                    onClick={onPrint}
                                >

                                    {printRenderingLoading ? (
                                        <Loading/>
                                    ) : (
                                        <img
                                            className={"h-[20px]"}
                                            src={'/assets/printer.png'}
                                        />
                                    )}


                                </motion.div>

                            )}

                        </AnimatePresence>


                        <div
                            className={"flex-1 flex gap-[30px] overflow-y-auto mt-[20px] w-full"}
                        >

                            <div
                                className={"flex-1 flex flex-col shrink-1 h-full"}
                            >

                                <p
                                    className={"text-[1.1em] font-bold"}
                                >Selected Labels</p>

                                <div
                                    className={"flex flex-col gap-[10px] mt-[15px] overflow-y-auto flex-1"}
                                >
                                    {selectedLabels.map((label) => (
                                        <div
                                            key={label.name}
                                            className={"flex items-center"}
                                        >

                                            <p
                                                className={"text-[1.1em] font-bold "}
                                            >{label.count}x</p>

                                            <div
                                                className={"w-[2px] h-[20px] bg-[#3F3F3F] mx-[10px]"}
                                            />

                                            <p
                                                className={"text-[1.1em] font-bold "}
                                            >{label.name}</p>

                                            <div
                                                className={"w-[3px] aspect-[1] bg-[#D9D9D9] rounded-[100px] mx-[10px]"}
                                            />

                                            <p
                                                className={"text-[0.9em] italic"}
                                            >{label.type}</p>


                                        </div>
                                    ))}
                                </div>

                            </div >

                            <div
                                style={{
                                    background:"linear-gradient(0deg, #070707, #171717)"
                                }}
                                className={"[flex:1.5] p-[20px_30px] rounded-[30px]"}
                            >

                                <p
                                    className={"font-bold text-[1.1em]"}
                                >Printer Information</p>


                                <div className={"w-full mt-[20px] relative pl-[10px] overflow-relative"} >

                                    <div
                                        className={"h-full w-[2px] rounded-[100px] absolute left-0 top-0 bg-[#789DEF]"}
                                    ></div>

                                    <p
                                        className={"font-bold text-[1em]"}
                                    >Available Printers</p>
                                    <p
                                        className={"italic text-[0.7em]"}
                                    >Printer MUST be a laser printer</p>

                                    <div
                                        className={"flex flex-col gap-[5px] mt-[10px]"}
                                    >
                                        <AnimatePresence initial={false} mode="popLayout">
                                            {printers.map((printerName) => (
                                                <motion.div

                                                    key={printerName}
                                                    layout
                                                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                                    transition={{ duration: 0.15, ease: 'easeOut' }}

                                                    whileTap={{scale: 0.9}}
                                                    whileHover={{scale: 1.03}}
                                                    className={"flex items-start w-full gap-[10px] p-[5px_10px] cursor-pointer rounded-[20px]"}

                                                    onClick={() => setSelectedPrinter(printerName)}
                                                >

                                                    <img
                                                        className={"w-[15px] pt-[5px]"}
                                                        src={selectedPrinter === printerName ? '/assets/check-circ-bl.png' : "/assets/printer.png"}
                                                    />

                                                    <p
                                                        className={"text-[1.1em]"}
                                                    >{printerName}</p>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                    </div>

                                    {printersLoading&& (
                                        <div
                                            className={"w-full mt-[10px] flex items-center justify-center"}
                                        ><Loading/></div>
                                    )}

                                </div>

                            </div>


                        </div>

                    </div>

                    {/*Rendering QR Codes Page*/}
                    <AnimatePresence>
                        {printRenderingLoading&& (
                            <motion.div

                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                exit={{opacity: 0}}


                                className={`absolute left-0 top-0 w-full h-full bg-[#000000]/80 z-10 flex flex-col items-center justify-center z-200`}
                            >

                                <Loading size={40}/>

                                <p
                                    className={"text-[2em] font-bold mt-[50px]"}
                                >Rendering QR Codes</p>

                                {qrCodeRenderProgress&& (
                                    <p
                                        className={"text-[1em]"}
                                    >{qrCodeRenderProgress?.inc}/{qrCodeRenderProgress?.tot}</p>
                                )}

                            </motion.div>
                        )}
                    </AnimatePresence>


                </motion.div>


            </motion.div>
        </motion.div>
    )
}



const PrintingScreen = (
    { printingProgress }:{ printingProgress:PrintProgress }
) => {


    return (
        <div
            className={"w-full h-full p-[20px_30px] flex flex-col items-center justify-center"}
        >

            <DotLottieReact
                height={30}
                autoplay
                loop
                speed={0.5}
                src={'/assets/animations/printing.lottie'}
            />


            <div
                className={"absolute bottom-[20px] left-0 w-full flex flex-col items-center justify-center bg-[#000] z-100"}
            >

                <p
                    className={"text-[2em] font-bold"}
                >Printing Labels</p>


                {printingProgress && (
                    <div
                        className={"flex gap-[20px] items-center"}
                    >
                        <Loading size={20} />

                        <p
                            className={"text-[1.5em] font-bold"}
                        >{printingProgress.phase.charAt(0).toUpperCase() + printingProgress.phase.slice(1)}</p>
                    </div>

                )}


                {(printingProgress&&printingProgress.phase==="printing") && (
                    <p
                        className={"text-[1em]"}
                    >{printingProgress?.current }/{printingProgress?.total} sheets done</p>
                )}



            </div>

        </div>
    )
}

const SHEET_CSS = `
  @page { size: 8.5in 11in; margin: 0; }

  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; }

  .sheet {
    width: 8.5in; height: 11in;
    padding: 0.667in 0.188in 0;
    display: grid;
    grid-template-columns: repeat(2, 4in);
    grid-template-rows: repeat(3, 3in);
    column-gap: 0.124in; row-gap: 0.333in;
    justify-content: center; align-content: start;
    overflow: hidden;
  }

  .label {
    position: relative;
    width: 4in; height: 3in;
    border-radius: 0.0625in;
    overflow: hidden;
  }

  .rotate {
    position: absolute; top: 50%; left: 50%;
    width: 3in; height: 4in;
    transform: translate(-50%, -50%) rotate(90deg);
  }
`;

const getPages = async (labels: { name: string; type: string, url:string }[], disabledStickers:boolean[]) => {
    const assets = await loadAssets(labels.map(l=>l.url));
    const docs: string[] = [];


    const splicedLabels:({ name: string; type: string }|null)[] = labels
    disabledStickers.forEach((val, index)=>!val&&splicedLabels.splice(index, 0, null))


    for (let i = 0; i < labels.length; i += PER_PAGE) {
        const page = labels.slice(i, i + PER_PAGE);

        const cells = Array.from({ length: PER_PAGE }, (_, j) => (
            `<div class="label"><div class="rotate">${
                page[j] ? getLabelHTML(page[j], assets) : ""
            }</div></div>`
        )).join("");


        docs.push(`
            <!DOCTYPE html>
            <html lang="en"><head><meta charset="utf-8"><style>${SHEET_CSS}</style></head>
            <body><div class="sheet">${cells}</div></body></html>
        `);
    }

    return docs;
};

const PER_PAGE = 6;


type labelAssets = { bg: string, qrCodes: {[key:string]: string } };
let assetPromise: Promise<labelAssets> | null = null;


const loadAssets = (urls:string[]): Promise<labelAssets> => {
    assetPromise ??= (async () => {
        const [bg] = await Promise.all([
            toBase64("/assets/label/bg.png"),
        ]);

        console.log(urls)

        const qrCodes:{[key:string]:string} = {}


        let inc=0
        const tot = urls.length
        EEGlobal.emit("setQrCodeRenderingProgress", { inc, tot })


        for ( const url of urls) {
            if (qrCodes[url]===undefined)  {
                qrCodes[url] = await invoke("get_qr", { url })
            }
            inc++
            EEGlobal.emit("setQrCodeRenderingProgress", { inc, tot })
        }


        return { bg, qrCodes };
    })();
    return assetPromise;
};


const getLabelHTML = (
    label: { name: string; type: string, url: string },
    assets:labelAssets
) => `
  <div style="width:100%;height:100%;background-color:#fff;position:relative;padding:10px;border-radius:20px;">
    <img
      style="height:100%;width:100%;position:absolute;left:0;top:0;border-radius:20px;"
      src="${assets.bg}"
    />
    <div style="width:100%;height:100%;display:flex;flex-direction:column;background-color:#fff;z-index:10;position:relative;border-radius:20px;">
      <div style="padding:15px 0;justify-content:center;align-items:center;display:flex;width:100%;border-bottom:2px solid #000;">
        <p style="color:#000;font-weight:bold;font-size:1.2em;margin:0;">
          Lock Out Tag Out Procedures
        </p>
      </div>
      <div style="display:flex;flex:1;flex-direction:column;justify-content:space-evenly;align-items:center;width:100%;">
        <img style="width:250px;" src="${assets.qrCodes[label.url]}" />
        <div style="display:flex;align-items:center;justify-content:center;flex-direction:column;">
          <p style="font-size:1.2em;color:#4F81BD;font-weight:bold;margin:0;">${label.name}</p>
          <p style="font-size:0.9em;color:#000;margin:0;">${label.type}</p>
        </div>
      </div>
    </div>
  </div>
`;


export default PrintScreen