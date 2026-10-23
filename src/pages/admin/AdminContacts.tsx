import { useEffect, useState } from 'react';
import { Users, Download, Search, MessageCircle, Mail, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, CustomerContact } from '@/types';
import { formatBRL } from '@/lib/format';

export default function AdminContacts() {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [optInFilter, setOptInFilter] = useState<string>('all');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);

    // First get all orders to compile contacts
    const { data: orders, error } = await supabase
      .from('orders')
      .select('customer_name, email, phone, total, marketing_opt_in, created_at')
      .order('created_at', { ascending: false });

    if (error || !orders) {
      setContacts([]);
      setLoading(false);
      return;
    }

    // Compile unique contacts from orders
    const contactMap = new Map<string, CustomerContact>();
    for (const order of orders as Order[]) {
      const existing = contactMap.get(order.email);
      if (existing) {
        existing.total_orders += 1;
        existing.total_spent += Number(order.total);
        if (order.marketing_opt_in) existing.whatsapp_opt_in = true;
        if (!existing.last_order_date || new Date(order.created_at) > new Date(existing.last_order_date)) {
          existing.last_order_date = order.created_at;
        }
      } else {
        contactMap.set(order.email, {
          id: order.email,
          name: order.customer_name,
          email: order.email,
          phone: order.phone,
          whatsapp_opt_in: order.marketing_opt_in,
          total_orders: 1,
          total_spent: Number(order.total),
          last_order_date: order.created_at,
          created_at: order.created_at,
        });
      }
    }

    // Upsert to customer_contacts table for persistence
    const contactsArray = Array.from(contactMap.values());
    for (const c of contactsArray) {
      await supabase.from('customer_contacts').upsert({
        name: c.name,
        email: c.email,
        phone: c.phone,
        whatsapp_opt_in: c.whatsapp_opt_in,
        total_orders: c.total_orders,
        total_spent: c.total_spent,
        last_order_date: c.last_order_date,
      }, { onConflict: 'email' });
    }

    setContacts(contactsArray);
    setLoading(false);
  };

  const exportCSV = () => {
    const filteredContacts = contacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search);
      const matchesOptIn = optInFilter === 'all' ||
        (optInFilter === 'yes' && c.whatsapp_opt_in) ||
        (optInFilter === 'no' && !c.whatsapp_opt_in);
      return matchesSearch && matchesOptIn;
    });

    const headers = ['Nome', 'E-mail', 'Telefone/WhatsApp', 'Opt-in WhatsApp', 'Total de Pedidos', 'Total Gasto', 'Último Pedido'];
    const rows = filteredContacts.map(c => [
      c.name,
      c.email,
      c.phone,
      c.whatsapp_opt_in ? 'Sim' : 'Nao',
      String(c.total_orders),
      String(c.total_spent),
      c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('pt-BR') : '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contatos-clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportWhatsAppList = () => {
    const optedIn = contacts.filter(c => c.whatsapp_opt_in);
    const list = optedIn.map(c => c.phone).join('\n');
    const blob = new Blob([list], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whatsapp-optin-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filtered = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesOptIn = optInFilter === 'all' ||
      (optInFilter === 'yes' && c.whatsapp_opt_in) ||
      (optInFilter === 'no' && !c.whatsapp_opt_in);
    return matchesSearch && matchesOptIn;
  });

  const optedInCount = contacts.filter(c => c.whatsapp_opt_in).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-espresso">Contatos de Clientes</h1>
          <p className="text-sm text-muted mt-1">
            {contacts.length} contatos • {optedInCount} com opt-in WhatsApp
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportWhatsAppList}
            disabled={optedInCount === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" /> Exportar WhatsApp
          </button>
          <button
            onClick={exportCSV}
            disabled={contacts.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
          />
        </div>
        <select
          value={optInFilter}
          onChange={e => setOptInFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
        >
          <option value="all">Todos os contatos</option>
          <option value="yes">Apenas com opt-in</option>
          <option value="no">Sem opt-in</option>
        </select>
      </div>

      {/* Contacts table */}
      <div className="bg-paper rounded-2xl border border-rim overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Carregando contatos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-rim mx-auto mb-3" />
            <p className="text-muted">Nenhum contato encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream text-muted text-xs uppercase">
                <tr>
                  <th className="px-3 py-3 text-left font-medium">Nome</th>
                  <th className="px-3 py-3 text-left font-medium hidden sm:table-cell">E-mail</th>
                  <th className="px-3 py-3 text-left font-medium">Telefone</th>
                  <th className="px-3 py-3 text-center font-medium">Opt-in</th>
                  <th className="px-3 py-3 text-right font-medium hidden sm:table-cell">Pedidos</th>
                  <th className="px-3 py-3 text-right font-medium hidden sm:table-cell">Total Gasto</th>
                  <th className="px-3 py-3 text-left font-medium hidden md:table-cell">Último Pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rim">
                {filtered.map(contact => (
                  <tr key={contact.id} className="hover:bg-cream transition-colors">
                    <td className="px-3 py-3">
                      <p className="font-medium text-espresso text-xs">{contact.name}</p>
                      <p className="text-xs text-muted sm:hidden">{contact.email}</p>
                    </td>
                    <td className="px-3 py-3 text-muted text-xs hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted" />
                        {contact.email}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted text-xs">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-3 h-3 text-green-600" />
                        {contact.phone}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {contact.whatsapp_opt_in ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-moss bg-moss/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted bg-rim/30 px-2 py-0.5 rounded-full">
                          <X className="w-3 h-3" /> Não
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-espresso text-xs hidden sm:table-cell">{contact.total_orders}</td>
                    <td className="px-3 py-3 text-right font-bold text-espresso text-xs hidden sm:table-cell">{formatBRL(contact.total_spent)}</td>
                    <td className="px-3 py-3 text-muted text-xs hidden md:table-cell">
                      {contact.last_order_date ? new Date(contact.last_order_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted leading-relaxed">
        Os contatos são compilados automaticamente a partir dos pedidos. O opt-in WhatsApp é registrado quando o cliente marca o checkbox de consentimento no checkout, em conformidade com a LGPD.
      </p>
    </div>
  );
}
