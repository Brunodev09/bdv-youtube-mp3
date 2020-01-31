export default class Output {
    constructor(public videoId: string, public stats: { transferredBytes: any; runtime: any; averageSpeed: number; } | null, public fileName: string | null, public url: string | null, public title: string | null, public artist: string | null, public thumbnail: string | null) {}
}