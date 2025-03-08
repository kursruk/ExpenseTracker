import { useLocation } from "wouter";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Check } from "@shared/schema";
import { useCurrency } from "@/hooks/use-currency";

interface CheckListProps {
  checks: Check[];
  year: number;
  month: number;
}

export function CheckList({ checks, year, month }: CheckListProps) {
  const [, navigate] = useLocation();
  const { format } = useCurrency();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const handleRowClick = (checkId: string) => {
    navigate(`/expenses/${year}/${month}/${checkId}`);
  };

  // Sort checks by check number in descending order
  const sortedChecks = [...checks].sort(
    (a, b) => b.checkNumber - a.checkNumber,
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Check #</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Shop</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedChecks.map((check) => (
            <TableRow
              key={check.id}
              className="cursor-pointer hover:bg-muted"
              onClick={() => handleRowClick(check.id)}
            >
              <TableCell>#{check.checkNumber}</TableCell>
              <TableCell>{formatDate(check.date)}</TableCell>
              <TableCell>{check.shopName}</TableCell>
              <TableCell className="text-right">
                {format(check.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
