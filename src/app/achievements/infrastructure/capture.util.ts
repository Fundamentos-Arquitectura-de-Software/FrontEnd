import html2canvas from 'html2canvas';

export function captureElementToPngBlob(element: HTMLElement): Promise<Blob | undefined> {
    return new Promise((resolve, reject) => {
        html2canvas(element)
            .then((canvas) => {
                canvas.toBlob(
                    (b: Blob | null) => {
                        resolve(b ?? undefined);
                    },
                    'image/png',
                    1 // calidad
                );
            })
            .catch((err) => reject(err));
    });
}
