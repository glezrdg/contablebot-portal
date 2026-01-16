import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import DashboardLayout from "@/components/DashboardLayout";
import AddClientModal from "@/components/AddClientModal";
import EditClientModal from "@/components/EditClientModal";
import type { Client, ErrorResponse } from "@/types";
import { formatCompactRnc } from "@/lib/rnc-validator";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

export default function ClientesPage() {
  const toast = useRef<Toast>(null);

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      } else {
        throw new Error("Error al cargar clientes");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los clientes",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientAdded = (client: Client) => {
    fetchClients();
    toast.current?.show({
      severity: "success",
      summary: "Cliente creado",
      detail: `${client.name} ha sido agregado exitosamente`,
      life: 3000,
    });
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setShowEditModal(true);
  };

  const handleClientUpdated = (client: Client) => {
    fetchClients();
    setShowEditModal(false);
    setClientToEdit(null);
    toast.current?.show({
      severity: "success",
      summary: "Cliente actualizado",
      detail: `${client.name} ha sido actualizado exitosamente`,
      life: 3000,
    });
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      // First, try to delete without deleteInvoices flag to check if client has invoices
      const checkResponse = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });

      if (checkResponse.status === 409) {
        // Client has invoices - show dialog with options
        const data = await checkResponse.json();
        const invoiceCount = data.invoiceCount || 0;

        confirmDialog({
          message: `${client.name} tiene ${invoiceCount} factura${invoiceCount !== 1 ? "s" : ""
            } asociada${invoiceCount !== 1 ? "s" : ""}. ¿Qué deseas hacer?`,
          header: "Cliente con facturas",
          icon: "pi pi-exclamation-triangle",
          acceptLabel: `Eliminar cliente y ${invoiceCount} factura${invoiceCount !== 1 ? "s" : ""
            }`,
          rejectLabel: "Cancelar",
          acceptClassName:
            "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg ml-2",
          rejectClassName:
            "bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg",
          accept: async () => {
            // Delete with invoices
            try {
              const deleteResponse = await fetch(
                `/api/clients/${client.id}?deleteInvoices=true`,
                {
                  method: "DELETE",
                }
              );

              if (!deleteResponse.ok) {
                const errorData: ErrorResponse = await deleteResponse.json();
                throw new Error(
                  errorData.error || "Error al eliminar el cliente"
                );
              }

              const result = await deleteResponse.json();
              fetchClients();
              toast.current?.show({
                severity: "success",
                summary: "Cliente eliminado",
                detail: result.message,
                life: 3000,
              });
            } catch (error) {
              console.error("Error deleting client with invoices:", error);
              toast.current?.show({
                severity: "error",
                summary: "Error",
                detail:
                  error instanceof Error
                    ? error.message
                    : "No se pudo eliminar el cliente",
                life: 3000,
              });
            }
          },
        });
      } else if (checkResponse.ok) {
        // Client deleted successfully (no invoices)
        const result = await checkResponse.json();
        fetchClients();
        toast.current?.show({
          severity: "success",
          summary: "Cliente eliminado",
          detail: result.message,
          life: 3000,
        });
      } else {
        // Other error
        const data: ErrorResponse = await checkResponse.json();
        throw new Error(data.error || "Error al eliminar el cliente");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el cliente",
        life: 3000,
      });
    }
  };

  // Filter clients by search query
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.rnc.includes(query) ||
      formatCompactRnc(client.rnc).toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout
      title="Clientes - ContableBot"
      description="Gestión de clientes"
    >
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/40 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-primary drop-shadow-sm" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Gestión de Clientes
              </h1>
            </div>
            <p className="text-muted-foreground">
              Administra tus clientes y sus datos fiscales
            </p>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25),0_6px_24px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-4px] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Total de clientes
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">
                    {clients.length}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(59,130,246,0.2)]">
                  <Building2 className="w-7 h-7 text-primary drop-shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-4 mb-6 shadow-[var(--glass-shadow)]">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar por nombre o RNC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Add Client Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-[hsl(221_83%_63%)] text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Agregar Cliente
              </button>
            </div>
          </div>

          {/* Clients Table */}
          <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">
                  Cargando clientes...
                </p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No se encontraron clientes con ese criterio de búsqueda"
                    : "No hay clientes registrados"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Agregar primer cliente
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        RNC/Cédula
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {client.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-foreground">
                            {formatCompactRnc(client.rnc)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {client.rnc.length === 9 ? "RNC" : "Cédula"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClient(client)}
                              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Editar cliente"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client)}
                              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={handleClientAdded}
      />

      {/* Edit Client Modal */}
      {clientToEdit && (
        <EditClientModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setClientToEdit(null);
          }}
          client={clientToEdit}
          onClientUpdated={handleClientUpdated}
        />
      )}
    </DashboardLayout>
  );
}
