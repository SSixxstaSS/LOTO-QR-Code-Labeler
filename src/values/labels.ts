import { create } from 'zustand'

export type Label = {
    name: string
    type: string
    url: string
    id: string
}

export type Labels = {
    labels:Label[],
    setLabels:(labels:Label[])=>void;
    setLabel:(label:Label)=>void;
    deleteLabel:(label:Label) => void;
    addLabel:(label:Label) => void;
}



const VLabels = create<Labels>(set => ({
    labels:[{name:"Pump Filler", type:"Filler", url:"https://youtube.com", id:String(Math.random())}],
    setLabels: (labels:Label[]) => set({ labels }),
    setLabel:(label)=>set(s=>({ labels:s.labels.map(l=>l.id===label.id?label:l) })),
    deleteLabel:(label)=>set(s=>({ labels:s.labels.filter(l=>l.id!==label.id) })),
    addLabel:(label)=>set(s=>({ labels:[label, ...s.labels]}))
}))




export default VLabels
