import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Search, Users, Calendar, Mail, X, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Ebook, EbookAccess } from '@/types';

interface AdminAccessManagerProps {
  ebook: Ebook;
  onBack: () => void;
}

interface AccessRow extends EbookAccess {
  user_email?: string;
}

export default function AdminAccessManager({ ebook, onBack }: AdminAccessManagerProps) {
  const [accessList, setAccessList] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [granting, setGranting] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: string; email: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [expiresIn, setExpiresIn] = useState('');

  const loadAccess = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ebook_access')
      .select('*')
      .eq('ebook_id', ebook.id)
      .order('granted_at', { ascending: false });

    if (error || !data) {
      setAccessList([]);
      setLoading(false);
      return;
    }

    const rows = data as EbookAccess[];
    const userIds = rows.map(r => r.user_id);
    const emailMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: userRows } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (userRows) {
        for (const u of userRows as Array<{ id: string; email: string }>) {
          emailMap[u.id] = u.email;
        }
      }
    }

    const withEmails: AccessRow[] = rows.map(r => ({
      ...r,
      user_email: emailMap[r.user_id] ?? '—',
    }));
    setAccessList(withEmails);
    setLoading(false);
  };

  useEffect(() => {
    loadAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebook.id]);

  const searchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setFoundUser(null);

    const { data: userData } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', searchEmail.trim())
      .maybeSingle();

    if (userData) {
      setFoundUser({ id: (userData as { id: string; email: string }).id, email: (userData as { id: string; email: string }).email });
    } else {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const match = authData?.users?.find(u =>
        u.email?.toLowerCase() === searchEmail.trim().toLowerCase()
      );
      if (match) {
        setFoundUser({ id: match.id, email: match.email ?? '' });
      }
    }
    setSearching(false);
  };

  const grantAccess = async () => {
    if (!foundUser) { alert('Busque e selecione um usuário primeiro.'); return; }
    setGranting(true);

    const existing = accessList.find(a => a.user_id === foundUser.id);
    if (existing) {
      alert('Este usuário já tem acesso a este e-book.');
      setGranting(false);
      return;
    }

    let expiresAt: string | null = null;
    if (expiresIn) {
      const days = parseInt(expiresIn);
      if (days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiresAt = d.toISOString();
      }
    }

    const { error } = await supabase.from('ebook_access').insert({
      ebook_id: ebook.id,
      user_id: foundUser.id,
      granted_by: 'admin',
      expires_at: expiresAt,
    });

    if (error) {
      if (error.code === '23505') {
        alert('Este usuário já tem acesso.');
      } else {
        alert('Erro ao conceder acesso: ' + error.message);
      }
      setGranting(false);
      return;
    }

    setGranting(false);
    setShowGrantForm(false);
    setFoundUser(null);
    setSearchEmail('');
    setExpiresIn('');
    loadAccess();
  };

  const revokeAccess = async (id: string, email: string) => {
    if (!confirm(`Revogar o acesso de "${email}" a este e-book?`)) return;
    const { error } = await supabase.from('ebook_access').delete().eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    loadAccess();
  };

  const inputClass = "w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted hover:text-wood mb-1 transition-colors">
            <X className="w-3.5 h-3.5" /> Voltar para E-books
          </button>
          <h1 className="font-serif text-xl font-semibold text-espresso">Gerenciar Acessos</h1>
          <p className="text-sm text-muted mt-0.5 flex items-center gap-2">
            <img src={ebook.cover_url} alt="" className="w-8 h-10 rounded object-cover" />
            {ebook.title}
          </p>
        </div>
        <button
          onClick={() => setShowGrantForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Conceder Acesso
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper rounded-xl border border-rim p-3 text-center">
          <Users className="w-5 h-5 text-wood mx-auto mb-1" />
          <p className="text-xl font-bold text-espresso">{accessList.length}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">Total</p>
        </div>
        <div className="bg-paper rounded-xl border border-rim p-3 text-center">
          <Shield className="w-5 h-5 text-moss mx-auto mb-1" />
          <p className="text-xl font-bold text-espresso">{accessList.filter(a => !a.expires_at || new Date(a.expires_at) > new Date()).length}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">Ativos</p>
        </div>
        <div className="bg-paper rounded-xl border border-rim p-3 text-center">
          <Calendar className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-espresso">{accessList.filter(a => a.expires_at && new Date(a.expires_at) <= new Date()).length}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">Expirados</p>
        </div>
      </div>

      {/* Access list */}
      {loading ? (
        <div className="p-8 text-center text-muted">Carregando...</div>
      ) : accessList.length === 0 ? (
        <div className="bg-paper rounded-2xl border border-rim p-8 text-center">
          <Users className="w-12 h-12 text-rim mx-auto mb-3" />
          <p className="text-muted">Nenhum acesso concedido ainda.</p>
          <p className="text-xs text-muted mt-1">Clique em "Conceder Acesso" para liberar um aluno.</p>
        </div>
      ) : (
        <div className="bg-paper rounded-xl border border-rim overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream/50 border-b border-rim">
              <tr>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted font-medium">Aluno</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted font-medium hidden sm:table-cell">Concedido em</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted font-medium hidden sm:table-cell">Expira em</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {accessList.map(row => {
                const isExpired = row.expires_at && new Date(row.expires_at) <= new Date();
                const isActive = !isExpired;
                return (
                  <tr key={row.id} className="border-b border-rim last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-wood/10 rounded-full flex items-center justify-center text-wood text-xs font-semibold flex-shrink-0">
                          {row.user_email?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <span className="text-sm text-espresso line-clamp-1">{row.user_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted hidden sm:table-cell">
                      {new Date(row.granted_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted hidden sm:table-cell">
                      {row.expires_at ? new Date(row.expires_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-moss/10 text-moss' : 'bg-red-100 text-red-700'}`}>
                        {isActive ? 'Ativo' : 'Expirado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => revokeAccess(row.id, row.user_email ?? 'este usuário')}
                        className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Revogar acesso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant access modal */}
      {showGrantForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGrantForm(false)}>
          <div className="bg-paper rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-rim">
              <h2 className="font-serif text-lg font-bold text-espresso">Conceder Acesso</h2>
              <button onClick={() => setShowGrantForm(false)} className="p-1.5 hover:bg-cream rounded-lg"><X className="w-5 h-5 text-muted" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted">E-mail do aluno</label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={e => { setSearchEmail(e.target.value); setFoundUser(null); }}
                      placeholder="aluno@email.com"
                      className="w-full pl-10 pr-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                      onKeyDown={e => e.key === 'Enter' && searchUser()}
                    />
                  </div>
                  <button
                    onClick={searchUser}
                    disabled={searching || !searchEmail.trim()}
                    className="px-4 py-2 bg-cream border border-rim text-espresso text-sm font-medium rounded-lg hover:border-wood transition-colors disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {foundUser && (
                <div className="flex items-center gap-2 p-3 bg-moss/10 border border-moss/30 rounded-lg">
                  <div className="w-8 h-8 bg-moss/20 rounded-full flex items-center justify-center text-moss text-xs font-semibold">
                    {foundUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-espresso line-clamp-1">{foundUser.email}</p>
                    <p className="text-[11px] text-moss">Usuário encontrado</p>
                  </div>
                </div>
              )}

              {searchEmail.trim() && !foundUser && !searching && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    Usuário não encontrado. O aluno precisa criar uma conta no site primeiro
                    (página "Entrar / Cadastrar"), depois você concede o acesso.
                  </p>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted">Expira em (dias) — opcional</label>
                <input
                  type="number"
                  value={expiresIn}
                  onChange={e => setExpiresIn(e.target.value)}
                  placeholder="Deixe vazio para acesso vitalício"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-rim">
              <button onClick={() => setShowGrantForm(false)} className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={grantAccess}
                disabled={granting || !foundUser}
                className="flex-1 py-2.5 bg-wood text-cream text-sm font-semibold rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
              >
                {granting ? 'Concedendo...' : 'Conceder Acesso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
