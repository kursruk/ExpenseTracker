import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Expense } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, Upload } from "lucide-react";
import { publishExpenses } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function ExpenseList({ expenses, onDelete, readOnly = false }: ExpenseListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Expense>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const result = await publishExpenses();
      toast({
        title: t('messages.publishSuccess'),
        description: result.message
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('messages.error'),
        description: t('messages.publishError')
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredAndSortedExpenses = useMemo(() => {
    return expenses
      .filter(expense =>
        expense.item.toLowerCase().includes(search.toLowerCase()) ||
        (expense.vendor?.toLowerCase() || '').includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (aValue === undefined || bValue === undefined) return 0;
        return sortDirection === "asc"
          ? aValue > bValue ? 1 : -1
          : bValue > aValue ? 1 : -1;
      });
  }, [expenses, search, sortField, sortDirection]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const handleSort = (field: keyof Expense) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{t('common.expenses')}</CardTitle>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePublish}
              disabled={isPublishing || expenses.length === 0}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isPublishing ? t('common.publishing') : t('common.publish')}
            </Button>
            <Link href="/expenses/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('common.addExpense')}
              </Button>
            </Link>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("date")} className="cursor-pointer">
                  {t('table.date')} {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead onClick={() => handleSort("item")} className="cursor-pointer">
                  {t('table.item')} {sortField === "item" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead onClick={() => handleSort("price")} className="cursor-pointer">
                  {t('table.price')} {sortField === "price" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead onClick={() => handleSort("count")} className="cursor-pointer">
                  {t('table.count')} {sortField === "count" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead onClick={() => handleSort("vendor")} className="cursor-pointer">
                  {t('table.vendor')} {sortField === "vendor" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer">
                  {t('table.created')} {sortField === "createdAt" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead onClick={() => handleSort("updatedAt")} className="cursor-pointer">
                  {t('table.updated')} {sortField === "updatedAt" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>{expense.item}</TableCell>
                  <TableCell>${expense.price.toFixed(2)}</TableCell>
                  <TableCell>{expense.count}</TableCell>
                  <TableCell>{expense.vendor || '-'}</TableCell>
                  <TableCell>{formatDateTime(expense.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(expense.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/expenses/edit/${expense.id}`}>
                      <Button variant="ghost" size="icon" className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}