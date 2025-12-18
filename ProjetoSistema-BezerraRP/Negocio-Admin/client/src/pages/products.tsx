import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import { useState } from "react";
import type { Product } from "@shared/schema";

const productCategories: Record<string, string[]> = {
  "Areias": [
    "Areia Média",
    "Areia Fina",
    "Areia Grossa",
    "Areia Média Grossa",
    "Areia Média Fina",
    "Areia Desclassificada",
    "Areia De Quadra",
  ],
  "Britas": [
    "Brita 1",
    "Brita 2",
    "Brita 3",
    "Brita 4",
  ],
  "Outros Agregados": [
    "Rachão",
    "BGS",
    "Pedrisco Limpo",
    "Pó de Pedra",
    "Argila Expandida",
  ],
  "Reciclados": [
    "Rachão Reciclado",
    "Bica Reciclada",
    "Brita Reciclada",
    "Brita 1 Reciclada",
    "Brita 2 Reciclada",
    "Brita 3 Reciclada",
    "Brita 4 Reciclada",
  ],
};

function getCategory(productName: string): string {
  for (const [category, products] of Object.entries(productCategories)) {
    if (products.includes(productName)) {
      return category;
    }
  }
  return "Outros";
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "Areias": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "Britas": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    "Outros Agregados": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "Reciclados": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "Outros": "bg-muted text-muted-foreground",
  };
  return colors[category] || colors["Outros"];
}

export default function Products() {
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedProducts = filteredProducts?.reduce((acc, product) => {
    const category = getCategory(product.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categoryOrder = ["Areias", "Britas", "Outros Agregados", "Reciclados", "Outros"];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Produtos</h1>
        <p className="text-muted-foreground">
          Catálogo de produtos disponíveis para venda
        </p>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-products"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupedProducts && Object.keys(groupedProducts).length > 0 ? (
        <div className="flex flex-col gap-8">
          {categoryOrder.map((category) => {
            const categoryProducts = groupedProducts[category];
            if (!categoryProducts || categoryProducts.length === 0) return null;

            return (
              <div key={category} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{category}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {categoryProducts.length} produto{categoryProducts.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryProducts.map((product) => (
                    <Card key={product.id} data-testid={`product-card-${product.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getCategoryColor(category)}`}>
                            <Package className="h-5 w-5" />
                          </div>
                          <div className="flex flex-1 flex-col gap-1">
                            <span className="font-medium">{product.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={product.active ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {product.active ? "Ativo" : "Inativo"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Unidade: {product.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Tente ajustar sua busca"
                : "Os produtos serão carregados automaticamente"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
