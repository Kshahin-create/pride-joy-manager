import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type Property = {
  id: string;
  name: string;
  code: string | null;
  property_type: string;
  status: string;
  city: string | null;
  logo_url: string | null;
};

interface ActivePropertyValue {
  properties: Property[];
  activePropertyId: string | null;
  activeProperty: Property | null;
  /** "all" = جميع العقارات (للمدير العام فقط) */
  setActivePropertyId: (id: string | null) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const Ctx = createContext<ActivePropertyValue | undefined>(undefined);
const STORAGE_KEY = "taam_active_property";

export function ActivePropertyProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [activePropertyId, setActivePropertyIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setProperties([]);
      setActivePropertyIdState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("id,name,code,property_type,status,city,logo_url")
      .order("name");
    if (!error) {
      const list = (data ?? []) as Property[];
      setProperties(list);
      // pick stored or default
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const validStored =
        stored === "all"
          ? (isSuperAdmin ? "all" : null)
          : list.find((p) => p.id === stored)?.id ?? null;
      if (validStored) {
        setActivePropertyIdState(validStored);
      } else if (list.length > 0) {
        setActivePropertyIdState(list[0].id);
        localStorage.setItem(STORAGE_KEY, list[0].id);
      } else {
        setActivePropertyIdState(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id, isSuperAdmin]);

  const setActivePropertyId = (id: string | null) => {
    setActivePropertyIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  };

  const activeProperty =
    activePropertyId && activePropertyId !== "all"
      ? properties.find((p) => p.id === activePropertyId) ?? null
      : null;

  return (
    <Ctx.Provider value={{ properties, activePropertyId, activeProperty, setActivePropertyId, refresh: load, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActiveProperty() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useActiveProperty must be used within ActivePropertyProvider");
  return v;
}
