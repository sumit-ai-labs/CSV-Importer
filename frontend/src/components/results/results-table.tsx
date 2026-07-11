import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRMRecord } from '../../types/import';
import { DataTable } from '../shared/data-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';

export interface ResultsTableProps {
  readonly records: readonly CRMRecord[];
}

export function ResultsTable({ records }: ResultsTableProps) {
  const columns = React.useMemo<ColumnDef<CRMRecord>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-3 h-8 gap-1 text-xs font-semibold"
            >
              Name
              <ArrowUpDown className="h-3 w-3" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.getValue('name') || '-'}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-3 h-8 gap-1 text-xs font-semibold"
            >
              Email
              <ArrowUpDown className="h-3 w-3" />
            </Button>
          );
        },
        cell: ({ row }) => row.getValue('email') || '-',
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ row }) => row.getValue('company') || '-',
      },
      {
        id: 'phone',
        header: 'Phone',
        accessorFn: (row) => `${row.country_code} ${row.mobile_without_country_code}`.trim(),
        cell: ({ row }) => row.getValue('phone') || '-',
      },
      {
        accessorKey: 'crm_status',
        header: 'CRM Status',
        cell: ({ row }) => {
          const status = row.getValue('crm_status') as string;
          return (
            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-muted text-muted-foreground ring-1 ring-inset ring-muted-foreground/10">
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'lead_owner',
        header: 'Lead Owner',
        cell: ({ row }) => row.getValue('lead_owner') || '-',
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={records as CRMRecord[]}
      maxHeight="400px"
      emptyMessage="No imported records found."
    />
  );
}
