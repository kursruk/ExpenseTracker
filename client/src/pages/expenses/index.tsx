import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, ChevronDown } from "lucide-react";
import { getAvailableMonths, getChecks } from "@/lib/storage";
import { CheckList } from "@/components/expenses/check-list";
import type { Check } from "@shared/schema";

interface MonthData {
  year: number;
  month: number;
  expanded: boolean;
  checks: Check[];
}

export default function ExpensesPage() {
  const [, navigate] = useLocation();
  const [expandedMonths, setExpandedMonths] = useState<MonthData[]>(() => {
    const availableMonths = getAvailableMonths();
    const expandedMonth = localStorage.getItem('expanded_month');

    return availableMonths.map(({ year, month }) => ({
      year,
      month,
      expanded: expandedMonth === `${year}-${month}`,
      checks: expandedMonth === `${year}-${month}` ? getChecks(year, month) : []
    }));
  });

  // Clear the expanded month from localStorage after it's used
  useEffect(() => {
    localStorage.removeItem('expanded_month');
  }, []);

  const toggleMonth = (year: number, month: number) => {
    setExpandedMonths(prev => prev.map(m => {
      if (m.year === year && m.month === month) {
        return {
          ...m,
          expanded: !m.expanded,
          checks: !m.expanded ? getChecks(year, month) : m.checks
        };
      }
      return m;
    }));
  };

  const formatMonth = (year: number, month: number) => {
    return new Date(year, month).toLocaleString('default', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Expenses by Month</CardTitle>
          <Button onClick={() => navigate("/expenses/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Check
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {expandedMonths.map(({ year, month, expanded, checks }) => (
              <div key={`${year}-${month}`} className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => toggleMonth(year, month)}
                >
                  {expanded ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                  {formatMonth(year, month)}
                </Button>

                {expanded && checks.length > 0 && (
                  <div className="pl-6">
                    <CheckList checks={checks} year={year} month={month} />
                  </div>
                )}

                {expanded && checks.length === 0 && (
                  <div className="pl-6 py-4 text-sm text-muted-foreground">
                    No checks for this month
                  </div>
                )}
              </div>
            ))}

            {expandedMonths.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No expenses recorded yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}