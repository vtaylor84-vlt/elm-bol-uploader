const MAX = 1800;

export const compressImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode_failed'));
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > MAX) {
            h *= MAX / w;
            w = MAX;
          }
        } else if (h > MAX) {
          w *= MAX / h;
          h = MAX;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = 'contrast(1.08) brightness(1.03)';
          ctx.drawImage(img, 0, 0, w, h);
        }

        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('encode_failed'))),
          'image/jpeg',
          0.82
        );
      };
    };
  });
