import { Injectable } from '@angular/core';

export type ShareStatus = 'ok' | 'unsupported' | 'error';

export interface SharePayload {
    title: string;
    text: string;
    url?: string;
    imageBlob?: Blob;
}

@Injectable({ providedIn: 'root' })
export class SocialShareService {

    async share(payload: SharePayload): Promise<ShareStatus> {
        // 1) si hay Web Share + archivos, vamos con eso
        const canShareFiles = !!(navigator as any).canShare && payload.imageBlob;
        const files = payload.imageBlob ? [new File([payload.imageBlob], 'achievement.png', { type: 'image/png' })] : [];

        try {
            if (navigator.share && (!payload.imageBlob || ((navigator as any).canShare?.({ files }) ?? false))) {
                await navigator.share({
                    title: payload.title,
                    text: payload.text,
                    url: payload.url,
                    ...(files.length ? { files } : {})
                } as any);
                return 'ok';
            }

            // 2) Fallback simple: abrir intent de X/Twitter con texto (u otra red)
            const tweet = encodeURIComponent(`${payload.text}${payload.url ? ' ' + payload.url : ''}`);
            window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank', 'noopener');
            return 'unsupported';
        } catch {
            return 'error';
        }
    }
}
