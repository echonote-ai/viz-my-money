import { useState, useMemo, useEffect } from "react";
import { Transaction } from "@/pages/Dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector } from "recharts";
import { TrendingDown, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths, addYears, subWeeks, subMonths, subYears, parseISO, startOfDay, endOfDay } from "date-fns";

interface ChartSectionProps {
  transactions: Transaction[];
  onFilterChange: (filtered: Transaction[]) => void;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

const ChartSection = ({ transactions, onFilterChange }: ChartSectionProps) => {
  const [timePeriod, setTimePeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  
  // Initialize currentDate to the most recent transaction date, or today if no transactions
  const [currentDate, setCurrentDate] = useState(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(t => {
        const [year, month, day] = t.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
      return new Date(Math.max(...dates.map(d => d.getTime())));
    }
    return new Date();
  });
  
  const [viewMode, setViewMode] = useState<"category" | "subcategory">("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Update currentDate when transactions change (e.g., after upload)
  useEffect(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(t => {
        const [year, month, day] = t.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
      const mostRecentDate = new Date(Math.max(...dates.map(d => d.getTime())));
      setCurrentDate(mostRecentDate);
    }
  }, [transactions.length]);

  const dateRange = useMemo(() => {
    if (timePeriod === "weekly") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    } else if (timePeriod === "monthly") {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    } else {
      return {
        start: startOfYear(currentDate),
        end: endOfYear(currentDate),
      };
    }
  }, [timePeriod, currentDate]);

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((t) => {
      // Parse the date string as local date (YYYY-MM-DD format from database)
      const [year, month, day] = t.date.split('-').map(Number);
      const transactionDate = new Date(year, month - 1, day);
      const rangeStart = startOfDay(dateRange.start);
      const rangeEnd = endOfDay(dateRange.end);
      
      return transactionDate >= rangeStart && transactionDate <= rangeEnd;
    });
    
    return filtered;
  }, [transactions, dateRange]);

  // Notify parent of filtered transactions
  useEffect(() => {
    onFilterChange(filteredTransactions);
  }, [filteredTransactions, onFilterChange]);

  const handlePrevious = () => {
    if (timePeriod === "weekly") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (timePeriod === "monthly") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subYears(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (timePeriod === "weekly") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (timePeriod === "monthly") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addYears(currentDate, 1));
    }
  };

  const totalIncome = filteredTransactions.reduce((sum, t) => sum + (t.income || 0), 0);
  const totalExpense = filteredTransactions.reduce((sum, t) => sum + (t.expense || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      if (t.expense > 0) {
        grouped[t.category] = (grouped[t.category] || 0) + t.expense;
      }
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const subcategoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    const transactionsToUse = selectedCategory
      ? filteredTransactions.filter((t) => t.category === selectedCategory)
      : filteredTransactions;
    
    transactionsToUse.forEach((t) => {
      if (t.expense > 0 && t.subcategory) {
        grouped[t.subcategory] = (grouped[t.subcategory] || 0) + t.expense;
      }
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, selectedCategory]);

  // Monthly expense data for bar chart - shows ALL months for trend analysis
  const monthlyData = useMemo(() => {
    if (timePeriod !== "monthly") return [];
    
    const monthlyExpenses: Record<string, Record<string, number>> = {};
    
    // Use ALL transactions to show monthly trend across entire dataset
    transactions.forEach((t) => {
      if (t.expense > 0) {
        const [year, month, day] = t.date.split('-').map(Number);
        const transactionDate = new Date(year, month - 1, day);
        const monthKey = format(transactionDate, "MMM yyyy");
        if (!monthlyExpenses[monthKey]) {
          monthlyExpenses[monthKey] = {};
        }
        monthlyExpenses[monthKey][t.category] = (monthlyExpenses[monthKey][t.category] || 0) + t.expense;
      }
    });

    // Convert to array format for chart and sort by date
    return Object.entries(monthlyExpenses)
      .map(([month, categories]) => ({
        month,
        total: Number(Object.values(categories).reduce((sum, val) => sum + val, 0).toFixed(2)),
        categories,
        sortDate: parseISO(`${month} 01`),
      }))
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
  }, [transactions, timePeriod]);

  // Custom tooltip for pie chart showing monthly breakdown
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const category = payload[0].name;
      const totalValue = payload[0].value;
      
      // Calculate monthly breakdown for this category
      const monthlyBreakdown: Record<string, number> = {};
      transactions.forEach((t) => {
        if (t.category === category && t.expense > 0) {
          const [year, month, day] = t.date.split('-').map(Number);
          const transactionDate = new Date(year, month - 1, day);
          const monthKey = format(transactionDate, "MMM yyyy");
          monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + t.expense;
        }
      });

      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2">{category}</p>
          <p className="text-sm text-primary font-bold mb-2">Total: ${totalValue.toFixed(2)}</p>
          <div className="border-t border-border pt-2 mt-2">
            <p className="text-xs text-muted-foreground mb-1">Monthly Breakdown:</p>
            {Object.entries(monthlyBreakdown)
              .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
              .map(([month, amount]) => (
                <div key={month} className="flex justify-between text-xs gap-4">
                  <span>{month}:</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const handlePieClick = (entry: any) => {
    if (viewMode === "category") {
      setSelectedCategory(entry.name);
      setViewMode("subcategory");
      setActiveIndex(undefined);
    }
  };

  const handleBackToCategories = () => {
    setViewMode("category");
    setSelectedCategory(null);
    setActiveIndex(undefined);
  };

  const currentData = viewMode === "category" ? categoryData : subcategoryData;

  return (
    <div className="space-y-6">
      {/* Time Period Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant={timePeriod === "weekly" ? "default" : "outline"}
              onClick={() => setTimePeriod("weekly")}
              size="sm"
            >
              Weekly
            </Button>
            <Button
              variant={timePeriod === "monthly" ? "default" : "outline"}
              onClick={() => setTimePeriod("monthly")}
              size="sm"
            >
              Monthly
            </Button>
            <Button
              variant={timePeriod === "yearly" ? "default" : "outline"}
              onClick={() => setTimePeriod("yearly")}
              size="sm"
            >
              Yearly
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[200px] text-center">
              {format(dateRange.start, "MMM d, yyyy")} - {format(dateRange.end, "MMM d, yyyy")}
            </div>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-card to-muted/20 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/20 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              ${totalExpense.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/20 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
            <DollarSign className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-primary' : 'text-secondary'}`}>
              ${netBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {viewMode === "category" ? "Expense Distribution" : `Subcategories: ${selectedCategory || "All"}`}
            </CardTitle>
            {viewMode === "subcategory" && (
              <Button variant="outline" size="sm" onClick={handleBackToCategories}>
                Back
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    if (percent < 0.05) return null;
                    const displayName = name.length > 8 ? name.substring(0, 8) + '...' : name;
                    return `${displayName} ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  onClick={viewMode === "category" ? handlePieClick : undefined}
                  style={{ cursor: viewMode === "category" ? "pointer" : "default" }}
                >
                  {currentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>
              {timePeriod === "monthly" ? "Monthly Expenses" : viewMode === "category" ? "Top Categories" : "Top Subcategories"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {timePeriod === "monthly" ? (
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={currentData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChartSection;
