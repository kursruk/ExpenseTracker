import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save } from "lucide-react";
import { getCheck, updateCheck, getShops } from "@/lib/storage";
import type { Check, CheckItem, InsertCheckItem, Shop } from "@shared/schema";

interface CheckViewProps {
  params: {
    year: string;
    month: string;
    id: string;
  };
}

export default function CheckView({ params }: CheckViewProps) {
  const [, navigate] = useLocation();
  const [check, setCheck] = useState<Check | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [newItem, setNewItem] = useState<Partial<InsertCheckItem>>({
    productName: "",
    price: 0,
    count: 1,
    unitOfMeasure: "pcs"
  });

  const year = parseInt(params.year);
  const month = parseInt(params.month);

  useEffect(() => {
    const loadedCheck = getCheck(year, month, params.id);
    if (!loadedCheck) {
      navigate("/expenses");
      return;
    }
    setCheck(loadedCheck);
    setShops(getShops());
  }, [params.id]);

  const handleAddItem = () => {
    if (!check || !newItem.productName) return;

    const items = [...check.items];
    const newItems = [...items, newItem as InsertCheckItem];
    const updatedCheck = updateCheck(year, month, check.id, newItems);
    setCheck(updatedCheck);
    setNewItem({
      productName: "",
      price: 0,
      count: 1,
      unitOfMeasure: "pcs"
    });
  };

  const handleUpdateItem = (index: number, updates: Partial<InsertCheckItem>) => {
    if (!check) return;

    const items = [...check.items];
    items[index] = { ...items[index], ...updates };
    const updatedCheck = updateCheck(year, month, check.id, items.map(item => ({
      productName: item.productName,
      price: item.price,
      count: item.count,
      unitOfMeasure: item.unitOfMeasure
    })));
    setCheck(updatedCheck);
  };

  if (!check) return null;

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Check #{check.checkNumber}</span>
            <Select
              value={check.shopId}
              onValueChange={(value) => {
                const shop = shops.find(s => s.id === value);
                if (shop) {
                  const updatedCheck = updateCheck(year, month, check.id, check.items);
                  setCheck(updatedCheck);
                }
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
              <Label className="col-span-2">Product Name</Label>
              <Label>Price</Label>
              <Label>Count</Label>
              <Label>Unit</Label>
            </div>

            {check.items.map((item, index) => (
              <div key={index} className="grid grid-cols-5 gap-4">
                <Input
                  className="col-span-2"
                  value={item.productName}
                  onChange={(e) => handleUpdateItem(index, { productName: e.target.value })}
                />
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => handleUpdateItem(index, { price: parseFloat(e.target.value) })}
                />
                <Input
                  type="number"
                  value={item.count}
                  onChange={(e) => handleUpdateItem(index, { count: parseFloat(e.target.value) })}
                />
                <Input
                  value={item.unitOfMeasure}
                  onChange={(e) => handleUpdateItem(index, { unitOfMeasure: e.target.value })}
                />
              </div>
            ))}

            <div className="grid grid-cols-5 gap-4">
              <Input
                className="col-span-2"
                placeholder="Product name"
                value={newItem.productName}
                onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Count"
                value={newItem.count}
                onChange={(e) => setNewItem({ ...newItem, count: parseFloat(e.target.value) })}
              />
              <Input
                placeholder="Unit"
                value={newItem.unitOfMeasure}
                onChange={(e) => setNewItem({ ...newItem, unitOfMeasure: e.target.value })}
              />
            </div>

            <Button onClick={handleAddItem} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-lg font-semibold">
            Total: ${check.total.toFixed(2)}
          </div>
          <Button onClick={() => navigate("/expenses")}>
            <Save className="mr-2 h-4 w-4" />
            Save Check
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}