import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addCheck, getShops, addShop } from "@/lib/storage";
import type { InsertCheck, Shop } from "@shared/schema";

export default function AddCheckPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [newShopName, setNewShopName] = useState("");

  useEffect(() => {
    setShops(getShops());
  }, []);

  const handleCreateShop = () => {
    if (!newShopName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a shop name"
      });
      return;
    }

    try {
      const newShop = addShop(newShopName.trim());
      setShops([...shops, newShop]);
      setSelectedShop(newShop.id);
      setNewShopName("");
      toast({
        title: "Success",
        description: "Shop created successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create shop"
      });
    }
  };

  const handleCreateCheck = () => {
    if (!selectedShop) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a shop"
      });
      return;
    }

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();

      const check: InsertCheck = {
        date: today.toISOString().split('T')[0],
        shopId: selectedShop,
        items: []
      };

      const newCheck = addCheck(year, month, check);
      navigate(`/expenses/${year}/${month}/${newCheck.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create check"
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Shop</label>
            <Select
              value={selectedShop}
              onValueChange={setSelectedShop}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Or Add New Shop</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter shop name"
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
              />
              <Button 
                onClick={handleCreateShop}
                disabled={!newShopName.trim()}
              >
                Add Shop
              </Button>
            </div>
          </div>

          <Button
            onClick={handleCreateCheck}
            className="w-full"
            disabled={!selectedShop}
          >
            Create Check
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}