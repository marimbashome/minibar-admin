// ============================================================
// MARIMBAS HOME — MINIBAR ADMIN PANEL (Etapa 2)
// ============================================================
// Panel de administración con mejoras de Etapa 2:
// - Gestión de imágenes de productos (upload a Supabase Storage)
// - Edición de bank_info por propiedad (CLABE, banco, beneficiario)
// - Notificaciones en tiempo real de nuevas órdenes (polling + sonido)
// - Slugs y configuración avanzada de propiedades
// - Vista de órdenes mejorada con filtros y estados
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// ── Supabase Config ──
const SUPABASE_URL = 'https://zqmcfdgrzlqzvfwyjegg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbWNmZGdyemxxenZmd3lqZWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTM3MDAsImV4cCI6MjA4Nzk4OTcwMH0.__uEB9DSRvNULN2ezmDlBQWxoSrj7d9EQZ48EFgiZEQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Helper: Supabase Storage URL for product images ──
function getProductImageUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${filename}`;
}

// ── Notification Sound ──
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch (e) { /* silently fail */ }
}

// ── Styles ──
// Marimbas Design System — dark mode tokens for admin
const theme = {
  primary: '#5c85ff',
  primaryDark: '#4a6fd4',
  success: '#96CEB4',
  warning: '#FFD700',
  danger: '#E17055',
  bg: '#0d1117',
  card: '#161b22',
  text: '#e6edf3',
  textMuted: '#8b949e',
  border: '#30363d',
  radius: '12px',
};

const styles = {
  app: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: theme.bg,
    minHeight: '100vh',
    color: theme.text,
  },
  header: {
    background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
    color: 'white',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  nav: {
    display: 'flex',
    gap: '4px',
    padding: '12px 24px',
    background: theme.card,
    borderBottom: `1px solid ${theme.border}`,
    overflowX: 'auto',
  },
  navBtn: (active) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: active ? theme.primary : 'transparent',
    color: active ? 'white' : theme.textMuted,
    fontWeight: active ? '600' : '500',
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    position: 'relative',
  }),
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: theme.danger,
    color: 'white',
    borderRadius: '10px',
    padding: '1px 6px',
    fontSize: '11px',
    fontWeight: '700',
    minWidth: '18px',
    textAlign: 'center',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  card: {
    background: theme.card,
    borderRadius: theme.radius,
    border: `1px solid ${theme.border}`,
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: '4px',
  },
  btnPrimary: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: theme.primary,
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: theme.danger,
    color: 'white',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnOutline: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    background: 'white',
    color: theme.text,
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    boxSizing: 'border-box',
  },
  statusBadge: (status) => {
    const colors = {
      pending: { bg: 'rgba(255,215,0,0.15)', color: '#FFD700', label: '⏳ Pendiente' },
      confirmed: { bg: 'rgba(150,206,180,0.15)', color: '#96CEB4', label: '✅ Confirmado' },
      cancelled: { bg: 'rgba(225,112,85,0.15)', color: '#E17055', label: '❌ Cancelado' },
      delivered: { bg: 'rgba(92,133,255,0.15)', color: '#5c85ff', label: '📦 Entregado' },
    };
    const c = colors[status] || colors.pending;
    return {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      background: c.bg,
      color: c.color,
    };
  },
  imgPreview: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
  },
  imgPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    border: `2px dashed ${theme.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    background: '#f1f5f9',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: `2px solid ${theme.border}`,
    fontWeight: '600',
    color: theme.textMuted,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  td: {
    padding: '10px 12px',
    borderBottom: `1px solid ${theme.border}`,
    verticalAlign: 'middle',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  toast: (type) => ({
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '10px',
    background: type === 'error' ? theme.danger : theme.success,
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    zIndex: 300,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'slideIn 0.3s ease',
  }),
};

// ── Toast Component ──
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div style={styles.toast(type)}>{message}</div>;
}

// ── Auth Screen ──
function AuthScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      onLogin(data.user);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{ ...styles.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...styles.card, maxWidth: '400px', width: '100%', margin: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏠</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Marimbas Home</h1>
          <p style={{ color: theme.textMuted, fontSize: '14px' }}>Panel de Administración — Minibar</p>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            background: 'white',
            color: theme.text,
            fontWeight: '600',
            fontSize: '14px',
            cursor: googleLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            opacity: googleLoading ? 0.7 : 1,
            transition: 'all 0.2s',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
          <span style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '500' }}>o con email</span>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '12px' }}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Contraseña</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div style={{ color: theme.danger, fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
          <button type="submit" style={{ ...styles.btnPrimary, width: '100%', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Image Upload Component ──
function ImageUpload({ currentUrl, onUpload, productName }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede superar 2MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const safeName = (productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `${safeName}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('product-images').upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;
      onUpload(filename);
    } catch (err) {
      alert('Error al subir imagen: ' + err.message);
    }
    setUploading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {currentUrl ? (
        <img src={getProductImageUrl(currentUrl)} alt="" style={styles.imgPreview} />
      ) : (
        <div style={styles.imgPlaceholder}>📷</div>
      )}
      <div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} />
        <button
          style={styles.btnOutline}
          onClick={() => fileRef.current.click()}
          disabled={uploading}
        >
          {uploading ? '⏳ Subiendo...' : currentUrl ? '🔄 Cambiar' : '📤 Subir imagen'}
        </button>
        {currentUrl && (
          <button
            style={{ ...styles.btnOutline, marginLeft: '8px', color: theme.danger }}
            onClick={() => onUpload(null)}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}

// ── ORDERS TAB (Phase 2 — reads from orders + order_items) ──
function OrdersTab({ properties, newOrderIds, clearNewOrders }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ property: 'all', status: 'all' });
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = useCallback(async () => {
    let q = supabase.from('orders').select(`
      *,
      property:properties(name),
      order_items(id, product_name, quantity, unit_price, subtotal)
    `).order('created_at', { ascending: false }).limit(100);

    if (filter.property !== 'all') q = q.eq('property_id', filter.property);
    if (filter.status !== 'all') q = q.eq('order_status', filter.status);

    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchOrders();
    clearNewOrders();
  }, [fetchOrders, clearNewOrders]);

  const updateStatus = async (id, newStatus) => {
    await supabase.from('orders').update({ order_status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    fetchOrders();
  };

  const statusLabel = (s) => {
    const map = { pending: '⏳ Pendiente', confirmed: '✅ Confirmado', cancelled: '❌ Cancelado', delivered: '📦 Entregado' };
    return map[s] || s;
  };

  const payLabel = (s) => {
    const map = { pending: '🔄 Por cobrar', paid: '✅ Pagado', failed: '❌ Fallido' };
    return map[s] || s;
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ ...styles.card, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={styles.label}>Propiedad</label>
          <select style={styles.select} value={filter.property} onChange={e => setFilter(f => ({ ...f, property: e.target.value }))}>
            <option value="all">Todas</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={styles.label}>Estado orden</label>
          <select style={styles.select} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <button style={styles.btnOutline} onClick={fetchOrders}>🔄 Actualizar</button>
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Cargando órdenes...</div>
      ) : orders.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <p style={{ color: theme.textMuted }}>No hay órdenes con estos filtros</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>No. Orden</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Propiedad</th>
                <th style={styles.th}>Huésped</th>
                <th style={styles.th}>Items</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Pago</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <React.Fragment key={o.id}>
                <tr style={newOrderIds.has(o.id) ? { background: '#eff6ff' } : {}} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer' }}>
                    {expanded === o.id ? '▼' : '▶'} {o.order_number}
                  </td>
                  <td style={styles.td}>
                    {new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={styles.td}>{o.property?.name || '—'}</td>
                  <td style={styles.td}>{o.guest_name || '—'}{o.guest_room ? ` (${o.guest_room})` : ''}</td>
                  <td style={styles.td}>{(o.order_items || []).length}</td>
                  <td style={styles.td}><strong>${Number(o.total).toFixed(2)}</strong></td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(o.payment_status === 'paid' ? 'confirmed' : 'pending')}>{payLabel(o.payment_status)}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(o.order_status)}>{statusLabel(o.order_status)}</span>
                  </td>
                  <td style={styles.td}>
                    <select
                      style={{ ...styles.select, width: 'auto', padding: '6px 8px', fontSize: '12px' }}
                      value={o.order_status}
                      onChange={e => { e.stopPropagation(); updateStatus(o.id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                </tr>
                {expanded === o.id && (o.order_items || []).length > 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '0 16px 12px 40px', background: '#f8fafc' }}>
                      <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '4px', fontWeight: '600' }}>Detalle de la orden:</div>
                      {o.order_items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${theme.border}`, fontSize: '13px' }}>
                          <span>{item.product_name} x{item.quantity}</span>
                          <span style={{ fontWeight: '600' }}>${Number(item.subtotal).toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: theme.textMuted }}>
                        <span>Método: {o.payment_method === 'mercadopago' ? 'Mercado Pago' : o.payment_method === 'transfer' ? 'Transferencia' : 'Efectivo'}</span>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── PRODUCTS TAB ──
function ProductsTab({ properties }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchProducts = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, category:categories(name, icon)').order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setProducts(prods || []);
    setCategories(cats || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async (product) => {
    if (product.id) {
      await supabase.from('products').update({
        name: product.name,
        category_id: product.category_id,
        default_price: product.default_price,
        image_url: product.image_url,
        is_active: product.is_active,
      }).eq('id', product.id);
    } else {
      await supabase.from('products').insert({
        name: product.name,
        category_id: product.category_id,
        default_price: product.default_price,
        image_url: product.image_url,
        is_active: true,
      });
    }
    setShowModal(false);
    setEditProduct(null);
    fetchProducts();
  };

  const toggleActive = async (id, current) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    fetchProducts();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700' }}>🛍️ Productos ({products.length})</h2>
        <button style={styles.btnPrimary} onClick={() => { setEditProduct({ name: '', category_id: '', default_price: '', image_url: '', is_active: true }); setShowModal(true); }}>
          + Nuevo Producto
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Cargando...</div>
      ) : (
        <div style={styles.grid2}>
          {products.map(p => (
            <div key={p.id} style={{ ...styles.card, opacity: p.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                {p.image_url ? (
                  <img src={getProductImageUrl(p.image_url)} alt={p.name} style={styles.imgPreview} />
                ) : (
                  <div style={styles.imgPlaceholder}>
                    {p.category?.icon || '📦'}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{p.name}</div>
                  <div style={{ fontSize: '13px', color: theme.textMuted }}>{p.category?.icon} {p.category?.name}</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: theme.primary, marginTop: '4px' }}>
                    ${Number(p.default_price).toFixed(2)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={styles.btnOutline} onClick={() => { setEditProduct(p); setShowModal(true); }}>
                  ✏️ Editar
                </button>
                <button
                  style={{ ...styles.btnOutline, color: p.is_active ? theme.warning : theme.success }}
                  onClick={() => toggleActive(p.id, p.is_active)}
                >
                  {p.is_active ? '⏸️ Desactivar' : '▶️ Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Edit Modal */}
      {showModal && editProduct && (
        <ProductModal
          product={editProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState({ ...product });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.category_id || !form.default_price) {
      alert('Completa todos los campos requeridos');
      return;
    }
    onSave(form);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
          {product.id ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Imagen del producto</label>
            <ImageUpload
              currentUrl={form.image_url}
              productName={form.name}
              onUpload={(url) => setForm(f => ({ ...f, image_url: url }))}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={styles.label}>Nombre *</label>
            <input style={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={styles.label}>Categoría *</label>
            <select style={styles.select} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} required>
              <option value="">Seleccionar...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Precio base (MXN) *</label>
            <input style={styles.input} type="number" step="0.01" min="0" value={form.default_price} onChange={e => setForm(f => ({ ...f, default_price: e.target.value }))} required />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" style={styles.btnOutline} onClick={onClose}>Cancelar</button>
            <button type="submit" style={styles.btnPrimary}>💾 Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PROPERTIES TAB ──
function PropertiesTab() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProp, setEditProp] = useState(null);

  const fetchProperties = async () => {
    const { data } = await supabase.from('properties').select('*').order('name');
    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleSave = async (prop) => {
    await supabase.from('properties').update({
      name: prop.name,
      location: prop.location,
      address: prop.address,
      slug: prop.slug,
      whatsapp_number: prop.whatsapp_number,
      notification_email: prop.notification_email,
      notification_whatsapp: prop.notification_whatsapp,
      description: prop.description,
      bank_info: prop.bank_info,
      is_active: prop.is_active,
    }).eq('id', prop.id);
    setEditProp(null);
    fetchProperties();
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>🏠 Propiedades ({properties.length})</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Cargando...</div>
      ) : (
        <div style={styles.grid2}>
          {properties.map(p => (
            <div key={p.id} style={{ ...styles.card, opacity: p.is_active ? 1 : 0.5 }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{p.name}</div>
              <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '8px' }}>
                📍 {p.location || 'Sin ubicación'} · 🔗 /{p.slug || '—'}
              </div>
              <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                📱 {p.whatsapp_number || '—'} · ✉️ {p.notification_email || '—'}
              </div>
              {p.bank_info ? (
                <div style={{ fontSize: '12px', color: theme.textMuted, background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', marginTop: '8px' }}>
                  🏦 {p.bank_info.bank || '—'} · CLABE: {p.bank_info.clabe ? '****' + p.bank_info.clabe.slice(-4) : '—'}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: theme.warning, marginTop: '8px' }}>⚠️ Sin datos bancarios configurados</div>
              )}
              <button style={{ ...styles.btnOutline, marginTop: '12px' }} onClick={() => setEditProp(p)}>
                ✏️ Configurar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Property Edit Modal */}
      {editProp && (
        <PropertyModal property={editProp} onSave={handleSave} onClose={() => setEditProp(null)} />
      )}
    </div>
  );
}

function PropertyModal({ property, onSave, onClose }) {
  const [form, setForm] = useState({
    ...property,
    bank_info: property.bank_info || { clabe: '', bank: '', beneficiary: '' },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const updateBankInfo = (field, value) => {
    setForm(f => ({ ...f, bank_info: { ...f.bank_info, [field]: value } }));
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
          ⚙️ Configurar: {property.name}
        </h3>
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={{ ...styles.cardTitle, borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px' }}>📋 Información General</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={styles.label}>Nombre</label>
              <input style={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={styles.label}>Slug (URL)</label>
              <input style={styles.input} value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="mi-propiedad" />
            </div>
            <div>
              <label style={styles.label}>Ubicación</label>
              <input style={styles.input} value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label style={styles.label}>Dirección</label>
              <input style={styles.input} value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Descripción</label>
            <textarea
              style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción breve de la propiedad..."
            />
          </div>

          {/* Notifications */}
          <div style={{ ...styles.cardTitle, borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px' }}>🔔 Notificaciones</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={styles.label}>WhatsApp principal</label>
              <input style={styles.input} value={form.whatsapp_number || ''} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="+521234567890" />
            </div>
            <div>
              <label style={styles.label}>WhatsApp notificaciones</label>
              <input style={styles.input} value={form.notification_whatsapp || ''} onChange={e => setForm(f => ({ ...f, notification_whatsapp: e.target.value }))} placeholder="+521234567890" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Email notificaciones</label>
              <input style={styles.input} type="email" value={form.notification_email || ''} onChange={e => setForm(f => ({ ...f, notification_email: e.target.value }))} placeholder="admin@ejemplo.com" />
            </div>
          </div>

          {/* Bank Info */}
          <div style={{ ...styles.cardTitle, borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px' }}>🏦 Datos Bancarios (Transferencia)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>CLABE Interbancaria</label>
              <input style={styles.input} value={form.bank_info.clabe || ''} onChange={e => updateBankInfo('clabe', e.target.value)} placeholder="018 XXX XXXX XXXX XXXX X" maxLength={18} />
            </div>
            <div>
              <label style={styles.label}>Banco</label>
              <input style={styles.input} value={form.bank_info.bank || ''} onChange={e => updateBankInfo('bank', e.target.value)} placeholder="Ej: BBVA, Banorte, etc." />
            </div>
            <div>
              <label style={styles.label}>Beneficiario</label>
              <input style={styles.input} value={form.bank_info.beneficiary || ''} onChange={e => updateBankInfo('beneficiary', e.target.value)} placeholder="Nombre del beneficiario" />
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <span style={{ fontSize: '14px' }}>Propiedad activa</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" style={styles.btnOutline} onClick={onClose}>Cancelar</button>
            <button type="submit" style={styles.btnPrimary}>💾 Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── INVENTORY TAB ──
function InventoryTab({ properties }) {
  const [selectedProperty, setSelectedProperty] = useState('');
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!selectedProperty) return;
    setLoading(true);
    const [{ data: inv }, { data: prods }] = await Promise.all([
      supabase.from('inventory').select('*, product:products(name, default_price, image_url, category:categories(name, icon))').eq('property_id', selectedProperty),
      supabase.from('products').select('id, name').eq('is_active', true),
    ]);
    setInventory(inv || []);
    setProducts(prods || []);
    setLoading(false);
  }, [selectedProperty]);

  useEffect(() => { if (selectedProperty) fetchInventory(); }, [selectedProperty, fetchInventory]);

  const updateInventoryItem = async (id, field, value) => {
    await supabase.from('inventory').update({ [field]: value }).eq('id', id);
    fetchInventory();
  };

  const addToInventory = async (productId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    await supabase.from('inventory').insert({
      property_id: selectedProperty,
      product_id: productId,
      quantity: 10,
      min_stock: 2,
    });
    fetchInventory();
  };

  const existingProductIds = new Set(inventory.map(i => i.product_id));
  const availableProducts = products.filter(p => !existingProductIds.has(p.id));

  return (
    <div>
      <div style={{ ...styles.card, display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={styles.label}>Seleccionar Propiedad</label>
          <select style={styles.select} value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}>
            <option value="">— Elegir propiedad —</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {selectedProperty && availableProducts.length > 0 && (
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={styles.label}>Agregar producto</label>
            <select style={styles.select} onChange={e => { if (e.target.value) addToInventory(e.target.value); e.target.value = ''; }}>
              <option value="">+ Agregar al inventario...</option>
              {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {!selectedProperty ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
          <p style={{ color: theme.textMuted }}>Selecciona una propiedad para ver su inventario</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Cargando inventario...</div>
      ) : inventory.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
          <p style={{ color: theme.textMuted }}>No hay productos en el inventario de esta propiedad</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Min. Stock</th>
                <th style={styles.th}>Precio Override</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const lowStock = item.quantity <= (item.min_stock || 0);
                return (
                  <tr key={item.id} style={lowStock ? { background: '#fef2f2' } : {}}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.product?.image_url ? (
                          <img src={getProductImageUrl(item.product.image_url)} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '20px' }}>{item.product?.category?.icon || '📦'}</span>
                        )}
                        <div>
                          <div style={{ fontWeight: '600' }}>{item.product?.name}</div>
                          <div style={{ fontSize: '12px', color: theme.textMuted }}>{item.product?.category?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        min="0"
                        style={{ ...styles.input, width: '70px', textAlign: 'center' }}
                        value={item.quantity}
                        onChange={e => updateInventoryItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        min="0"
                        style={{ ...styles.input, width: '70px', textAlign: 'center' }}
                        value={item.min_stock || 0}
                        onChange={e => updateInventoryItem(item.id, 'min_stock', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        style={{ ...styles.input, width: '90px' }}
                        value={item.price_override || ''}
                        placeholder={`$${item.product?.default_price || 0}`}
                        onChange={e => updateInventoryItem(item.id, 'price_override', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                    <td style={styles.td}>
                      {lowStock ? (
                        <span style={{ color: theme.danger, fontWeight: '600', fontSize: '13px' }}>⚠️ Stock bajo</span>
                      ) : (
                        <span style={{ color: theme.success, fontSize: '13px' }}>✅ OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── CATEGORIES TAB ──
function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState(null);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async (cat) => {
    if (cat.id) {
      await supabase.from('categories').update({ name: cat.name, icon: cat.icon, sort_order: cat.sort_order }).eq('id', cat.id);
    } else {
      await supabase.from('categories').insert({ name: cat.name, icon: cat.icon, sort_order: cat.sort_order || 0 });
    }
    setEditCat(null);
    fetchCategories();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700' }}>📂 Categorías</h2>
        <button style={styles.btnPrimary} onClick={() => setEditCat({ name: '', icon: '📦', sort_order: categories.length })}>
          + Nueva Categoría
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Cargando...</div>
      ) : (
        <div style={styles.grid3}>
          {categories.map(c => (
            <div key={c.id} style={{ ...styles.card, textAlign: 'center', cursor: 'pointer' }} onClick={() => setEditCat(c)}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{c.icon}</div>
              <div style={{ fontWeight: '600' }}>{c.name}</div>
              <div style={{ fontSize: '12px', color: theme.textMuted }}>Orden: {c.sort_order}</div>
            </div>
          ))}
        </div>
      )}

      {editCat && (
        <div style={styles.overlay} onClick={() => setEditCat(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
              {editCat.id ? '✏️ Editar' : '➕ Nueva'} Categoría
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={styles.label}>Icono (emoji)</label>
              <input style={styles.input} value={editCat.icon} onChange={e => setEditCat(c => ({ ...c, icon: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={styles.label}>Nombre</label>
              <input style={styles.input} value={editCat.name} onChange={e => setEditCat(c => ({ ...c, name: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Orden</label>
              <input style={styles.input} type="number" value={editCat.sort_order} onChange={e => setEditCat(c => ({ ...c, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button style={styles.btnOutline} onClick={() => setEditCat(null)}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={() => handleSave(editCat)}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD TAB ──
function DashboardTab({ properties }) {
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, pending: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ data: ordersData }, { data: inv }] = await Promise.all([
        supabase.from('orders').select('id, order_number, guest_name, total, order_status, payment_status, payment_method, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('inventory').select('quantity, min_stock'),
      ]);

      const allOrders = ordersData || [];
      const today = new Date().toDateString();
      const todayOrders = allOrders.filter(o => new Date(o.created_at).toDateString() === today);

      setStats({
        totalOrders: todayOrders.length,
        revenue: todayOrders.reduce((s, o) => s + Number(o.total || 0), 0),
        pending: allOrders.filter(o => o.order_status === 'pending').length,
        lowStock: (inv || []).filter(i => i.quantity <= (i.min_stock || 0)).length,
      });
      setRecentOrders(allOrders.slice(0, 5));
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Cargando dashboard...</div>;

  const statCards = [
    { icon: '📦', label: 'Órdenes Hoy', value: stats.totalOrders, color: theme.primary },
    { icon: '💰', label: 'Ingresos Hoy', value: `$${stats.revenue.toFixed(2)}`, color: theme.success },
    { icon: '⏳', label: 'Pendientes', value: stats.pending, color: theme.warning },
    { icon: '⚠️', label: 'Stock Bajo', value: stats.lowStock, color: theme.danger },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ ...styles.card, textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>{s.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: theme.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>📋 Últimas Órdenes</div>
        {recentOrders.length === 0 ? (
          <p style={{ color: theme.textMuted, fontSize: '14px' }}>No hay órdenes recientes</p>
        ) : (
          recentOrders.map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.border}` }}>
              <div>
                <span style={{ fontWeight: '600' }}>{o.guest_name || 'Huésped'}</span>
                <span style={{ color: theme.textMuted, fontSize: '13px', marginLeft: '8px' }}>
                  {o.order_number} — {new Date(o.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <strong>${Number(o.total).toFixed(2)}</strong>
                <span style={styles.statusBadge(o.order_status)}>{o.order_status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick links for properties */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>🔗 Links de Propiedades</div>
        <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '12px' }}>
          Comparte estos links con tus huéspedes para que accedan al minibar:
        </div>
        {properties.filter(p => p.slug).map(p => {
          const url = `https://minibar.marimbashome.com/?p=${p.slug}`;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.border}` }}>
              <div>
                <span style={{ fontWeight: '600' }}>{p.name}</span>
                <div style={{ fontSize: '13px', color: theme.primary }}>{url}</div>
              </div>
              <button style={styles.btnOutline} onClick={() => navigator.clipboard.writeText(url)}>
                📋 Copiar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MAIN APP ──
export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [toast, setToast] = useState(null);

  // New orders tracking for notifications
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [newOrderCount, setNewOrderCount] = useState(0);
  const lastCheckRef = useRef(new Date().toISOString());

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch properties
  useEffect(() => {
    if (!user) return;
    supabase.from('properties').select('*').order('name').then(({ data }) => {
      setProperties(data || []);
    });
  }, [user]);

  // Polling for new orders (every 15 seconds)
  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .gt('created_at', lastCheckRef.current)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setNewOrderIds(prev => {
          const next = new Set(prev);
          data.forEach(o => next.add(o.id));
          return next;
        });
        setNewOrderCount(prev => prev + data.length);
        lastCheckRef.current = new Date().toISOString();
        playNotificationSound();
        setToast({ message: `🔔 ${data.length} nueva(s) orden(es)!`, type: 'success' });

        // Update page title
        document.title = `(${data.length}) Nueva orden — Marimbas Admin`;
        setTimeout(() => { document.title = 'Marimbas Home — Admin'; }, 5000);
      }
    };

    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const clearNewOrders = useCallback(() => {
    setNewOrderCount(0);
    setNewOrderIds(new Set());
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (authLoading) {
    return (
      <div style={{ ...styles.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏠</div>
          <p style={{ color: theme.textMuted }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'orders', label: '📋 Órdenes', icon: '📋' },
    { id: 'products', label: '🛍️ Productos', icon: '🛍️' },
    { id: 'inventory', label: '📦 Inventario', icon: '📦' },
    { id: 'properties', label: '🏠 Propiedades', icon: '🏠' },
    { id: 'categories', label: '📂 Categorías', icon: '📂' },
  ];

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <span>🏠</span>
          <span>Marimbas Home Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>{user.email}</span>
          <button onClick={handleLogout} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
            Salir
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={styles.nav}>
        {tabs.map(t => (
          <button key={t.id} style={styles.navBtn(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.id === 'orders' && newOrderCount > 0 && (
              <span style={styles.badge}>{newOrderCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.container}>
        {activeTab === 'dashboard' && <DashboardTab properties={properties} />}
        {activeTab === 'orders' && <OrdersTab properties={properties} newOrderIds={newOrderIds} clearNewOrders={clearNewOrders} />}
        {activeTab === 'products' && <ProductsTab properties={properties} />}
        {activeTab === 'inventory' && <InventoryTab properties={properties} />}
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'categories' && <CategoriesTab />}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: ${theme.primary} !important; }
        table { min-width: 600px; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
}
