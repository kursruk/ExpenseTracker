import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseList } from "@/components/expenses/expense-list";
import { getArchive, clearArchive } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

export default function ArchivePage() {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const { toast } = useToast();
  const archive = getArchive();

  const handleClearArchive = () => {
    if (window.confirm(t('archive.confirmClear'))) {
      clearArchive();
      toast({
        title: t('archive.cleared'),
        description: t('archive.clearedDescription')
      });
      setSelectedMonth("");
    }
  };

  const selectedExpenses = selectedMonth
    ? archive.find(a => a.month === selectedMonth)?.expenses || []
    : [];

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{t('archive.title')}</CardTitle>
          <Button
            variant="destructive"
            onClick={handleClearArchive}
            disabled={archive.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('archive.clearAll')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('archive.selectMonth')} />
              </SelectTrigger>
              <SelectContent>
                {archive.map(({ month }) => (
                  <SelectItem key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedMonth && (
            <ExpenseList
              expenses={selectedExpenses}
              onDelete={() => {}} // No deletion in archive
              readOnly
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
