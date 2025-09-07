'use client';

import { useEffect, useState } from 'react';

export default function QuoteModal({
  providerId,
  providerName,
}: {
  providerId: number;
  providerName: string;
}) {
  const [serviceName, setServiceName] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // При открытии модалки читаем data-service из кнопки, которая её открыла
  useEffect(() => {
    const modal = document.getElementById('quoteModal');
    if (!modal) return;

    const onShow = (e: any) => {
      const trigger: HTMLElement | null = e.relatedTarget;
      const svc = trigger?.getAttribute('data-service') || '';
      setServiceName(svc);
      setSubmitted(false);
      setName('');
      setContact('');
      setMessage('');
    };

    modal.addEventListener('show.bs.modal', onShow);
    return () => modal.removeEventListener('show.bs.modal', onShow);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Мгновенно меняем UI на «отправлено»
    setSubmitted(true);

    // Отправляем письмо в фоне (не ждём ответа SMTP)
    fetch('/api/send-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId,
        providerName,
        serviceName, // <-- теперь точно уходит
        name,
        contact,
        message,
      }),
    }).catch(err => console.error('send-quote error', err));
  };

  return (
    <div className="modal fade" id="quoteModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {submitted ? (
            <div className="modal-body text-center p-5">
              <h5 className="mb-2">✅ Заявка отправлена!</h5>
              <p className="text-secondary mb-0">
                Мы свяжемся с вами в ближайшее время.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Запросить смету — {providerName}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Закрыть" />
              </div>
              <div className="modal-body">
                {!!serviceName && (
                  <div className="small text-secondary mb-2">
                    Услуга: <strong>{serviceName}</strong>
                  </div>
                )}
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Телефон или email"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-0">
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Опишите задачу"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Отправить
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
