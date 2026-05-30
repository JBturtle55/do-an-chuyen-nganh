import { useEffect } from 'react';

const DEFAULT_TITLE = 'FASTBUS — Đặt vé xe khách trực tuyến';
const DEFAULT_DESC  = 'Đặt vé xe khách nhanh chóng, tiện lợi. Hàng trăm tuyến xe từ TP.HCM, Hà Nội, Đà Nẵng và nhiều tỉnh thành trên cả nước.';

export default function useSEO({ title, description } = {}) {
  useEffect(() => {
    document.title = title ? `${title} | FASTBUS` : DEFAULT_TITLE;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description || DEFAULT_DESC;

    return () => {
      document.title = DEFAULT_TITLE;
      meta.content   = DEFAULT_DESC;
    };
  }, [title, description]);
}
