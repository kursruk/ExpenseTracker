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

interface CheckListProps {
  checks: Check[];
  year: number;
  month: number;
}

export function CheckList({ checks, year, month }: CheckListProps) {
  const [, navigate] = useLocation();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const handleRowClick = (checkId: string) => {
    navigate(`/expenses/${year}/${month}/${checkId}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Shop</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checks.map((check) => (
            <TableRow
              key={check.id}
              className="cursor-pointer hover:bg-muted"
              onClick={() => handleRowClick(check.id)}
            >
              <TableCell>
                {formatDate(check.date)}
              </TableCell>
              <TableCell>{check.shopName}</TableCell>
              <TableCell className="text-right">
                ${check.total.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}