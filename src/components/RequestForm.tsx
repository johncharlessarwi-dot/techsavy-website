import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '@appdeploy/client';
import { ArrowUpRight, CheckCircle2, X } from 'lucide-react';
import { services, createUuid } from '../../shared/domain';

export function errorMessage(e: unknown): string {
  const err = e as {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
  };
  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message ||
    'Something went wrong. Please try again.'
  );
}
export function RequestForm({
  kind = 'Quotation',
  productId = '',
  productName = '',
  service = '',
  onClose,
}: {
  kind?: string;
  productId?: string;
  productName?: string;
  service?: string;
  onClose?: () => void;
}) {
  const [token, setToken] = useState(() => createUuid());
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [reference, setReference] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setFailure('');
    try {
      const result = await api.post('/api/requests', {
        ...data,
        kind,
        productId,
        token,
        quantity: Number(data.quantity || 1),
        consent: data.consent === 'on',
      });
      setReference(result.data.reference);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className='request-card'>
      <div className='split'>
        <span className='eyebrow'>LET’S MAKE IT HAPPEN</span>
        {onClose && (
          <button
            className='icon-button'
            aria-label='Close request'
            onClick={onClose}
          >
            <X size={20} />
          </button>
        )}
      </div>
      {reference ? (
        <div className='success' role='status'>
          <CheckCircle2 size={40} />
          <h2>Request received.</h2>
          <p>
            Keep your reference: <strong>{reference}</strong>
          </p>
          <p>
            Your request is saved. TECHSAVY will review availability and contact
            you. This is not a payment or stock reservation.
          </p>
          <button
            className='button secondary'
            onClick={() => {
              setReference('');
              setToken(createUuid());
            }}
          >
            Send another request
          </button>
        </div>
      ) : (
        <>
          <h2>
            {kind === 'Service'
              ? 'Tell us what needs fixing.'
              : kind === 'Contact'
                ? 'Start a conversation.'
                : 'Let’s find your next upgrade.'}
          </h2>
          {productName && <p className='selected-product'>{productName}</p>}
          <form onSubmit={submit}>
            <div className='form-grid'>
              <label>
                Your name
                <input
                  name='name'
                  autoComplete='name'
                  required
                  maxLength={100}
                  placeholder='Full name'
                />
              </label>
              <label>
                Email or phone
                <input
                  name='contact'
                  autoComplete='email'
                  required
                  maxLength={150}
                  placeholder='How can we reach you?'
                />
              </label>
            </div>
            {kind === 'Service' && (
              <label>
                Service
                <select name='service' defaultValue={service || services[0]}>
                  {services.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
            {(kind === 'Product' || kind === 'Quotation') && (
              <label>
                Quantity
                <input
                  type='number'
                  name='quantity'
                  min={1}
                  max={10000}
                  defaultValue={1}
                  required
                />
              </label>
            )}
            <label>
              {kind === 'Service'
                ? 'Describe the issue'
                : 'What do you have in mind?'}
              <textarea
                name='message'
                rows={4}
                maxLength={3000}
                required={kind !== 'Product'}
                placeholder='Products, specifications, quantities or support you need…'
              />
            </label>
            <label className='honeypot' aria-hidden='true'>
              Website
              <input name='website' tabIndex={-1} autoComplete='off' />
            </label>
            <label className='checkbox'>
              <input type='checkbox' name='consent' required />I agree to be
              contacted about this request. My details will be visible to
              authorized TECHSAVY administrators.
            </label>
            <p className='fine-print'>
              Price, availability, warranty and delivery are confirmed by the
              team. No payment is collected here.
            </p>
            {failure && (
              <p className='error' role='alert'>
                {failure}
              </p>
            )}
            <button className='button primary' disabled={busy}>
              {busy ? 'Saving request…' : 'Send request'}
              <ArrowUpRight size={18} />
            </button>
          </form>
        </>
      )}
    </section>
  );
}
