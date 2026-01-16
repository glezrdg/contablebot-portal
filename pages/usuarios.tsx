/**
 * User Management Page
 *
 * Admin-only page for managing users with role-based access.
 * Requires Pro+ plan to access.
 */

import { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Users, UserPlus, Shield, UserX, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import CreateUserModal from '@/components/CreateUserModal';
import EditUserModal from '@/components/EditUserModal';
import type { Client } from '@/types';

interface User {
  id: number;
  email: string;
  fullName?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdBy?: number;
  createdAt: string;
  lastLoginAt?: string;
  assignedClients: Array<{
    id: number;
    name: string;
    isDefault: boolean;
  }>;
}

export default function UsuariosPage() {
  const toast = useRef<Toast>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users and clients on mount
  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar usuarios',
        life: 3000,
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleDeleteUser = (user: User) => {
    confirmDialog({
      message: `¿Está seguro que desea desactivar el usuario ${user.email}?`,
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg ml-2',
      rejectClassName: 'bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg',
      accept: async () => {
        try {
          const response = await fetch(`/api/users/${user.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al desactivar usuario');
          }

          toast.current?.show({
            severity: 'success',
            summary: 'Usuario desactivado',
            detail: `${user.email} ha sido desactivado`,
            life: 3000,
          });

          // Refresh users list
          fetchUsers();
        } catch (error) {
          console.error('Error deleting user:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error instanceof Error ? error.message : 'Error al desactivar usuario',
            life: 5000,
          });
        }
      },
    });
  };

  // DataTable templates
  const roleBodyTemplate = (rowData: User) => {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${rowData.role === 'admin'
          ? 'bg-orange-500/20 text-orange-400'
          : 'bg-blue-500/20 text-blue-400'
          }`}
      >
        {rowData.role === 'admin' && <Shield className="w-3 h-3" />}
        {rowData.role === 'admin' ? 'Administrador' : 'Usuario'}
      </span>
    );
  };

  const statusBodyTemplate = (rowData: User) => {
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${rowData.isActive
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-gray-500/20 text-gray-400'
          }`}
      >
        {rowData.isActive ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  const clientsBodyTemplate = (rowData: User) => {
    const clientCount = rowData.assignedClients.length;
    const defaultClient = rowData.assignedClients.find(c => c.isDefault);

    return (
      <div className="text-sm">
        <div className="font-medium text-foreground">
          {clientCount} cliente{clientCount !== 1 ? 's' : ''}
        </div>
        {defaultClient && (
          <div className="text-xs text-muted-foreground mt-1">
            Principal: {defaultClient.name}
          </div>
        )}
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: User) => {
    // Don't allow modifying admin users
    if (rowData.role === 'admin') {
      return (
        <div className="flex items-center justify-center gap-1">
          <span className="text-xs text-muted-foreground">Protegido</span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => {
            setSelectedUser(rowData);
            setShowEditModal(true);
          }}
          className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition"
          title="Editar usuario"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteUser(rowData)}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition"
          title="Desactivar usuario"
          disabled={!rowData.isActive}
        >
          {rowData.isActive ? <Trash2 className="w-4 h-4" /> : <UserX className="w-4 h-4 opacity-50" />}
        </button>
      </div>
    );
  };

  const lastLoginBodyTemplate = (rowData: User) => {
    if (!rowData.lastLoginAt) {
      return <span className="text-xs text-muted-foreground">Nunca</span>;
    }

    const date = new Date(rowData.lastLoginAt);
    return (
      <span className="text-xs text-foreground">
        {date.toLocaleDateString('es-DO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </span>
    );
  };

  return (
    <DashboardLayout
      title="Usuarios - ContableBot Portal"
      description="Gestión de usuarios"
      requireAdmin={true}
      requirePlan="pro"
    >
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/40 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-primary drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
              <p className="text-muted-foreground">
                Gestiona los usuarios con acceso a la firma
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-[hsl(221_83%_63%)] text-primary-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Crear Usuario
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
        <DataTable
          value={users}
          loading={loadingUsers}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
          showGridlines
          size="small"
          className="text-sm"
          emptyMessage="No hay usuarios registrados"
          paginatorClassName="dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700"
        >
          <Column
            field="email"
            header="Email"
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column
            field="fullName"
            header="Nombre"
            sortable
            body={(rowData) => rowData.fullName || <span className="text-muted-foreground">Sin nombre</span>}
            style={{ minWidth: '150px' }}
          />
          <Column
            field="role"
            header="Rol"
            body={roleBodyTemplate}
            sortable
            align="center"
            style={{ minWidth: '120px' }}
          />
          <Column
            header="Clientes"
            body={clientsBodyTemplate}
            style={{ minWidth: '150px' }}
          />
          <Column
            field="isActive"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            align="center"
            style={{ minWidth: '100px' }}
          />
          <Column
            field="lastLoginAt"
            header="Último acceso"
            body={lastLoginBodyTemplate}
            sortable
            align="center"
            style={{ minWidth: '120px' }}
          />
          <Column
            header="Acciones"
            body={actionsBodyTemplate}
            align="center"
            style={{ minWidth: '120px' }}
          />
        </DataTable>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={() => {
          fetchUsers();
          setShowCreateModal(false);
        }}
        clients={clients}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onUserUpdated={() => {
          fetchUsers();
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        allClients={clients}
      />
    </DashboardLayout>
  );
}
