"use client";

import * as React from "react";
import { X, MapPin } from "lucide-react";
import { MapView, type MapMarker } from "@/components/map/MapView";

interface RestaurantMapModalProps {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export function RestaurantMapModal({
  name,
  address,
  lat,
  lng,
}: RestaurantMapModalProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const marker: MapMarker = {
    id: 1,
    lat,
    lng,
    label: name,
    position: address,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-1 inline-flex items-center gap-0.5 text-accent text-[12px] font-medium shrink-0 hover:underline underline-offset-2"
      >
        <MapPin className="h-3 w-3" aria-hidden="true" />
        На карте
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-auto flex flex-col bg-surface-primary rounded-t-2xl overflow-hidden"
            style={{ height: "70dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light shrink-0">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-fg-primary truncate">{name}</div>
                <div className="text-[12px] text-fg-secondary truncate">{address}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-3 shrink-0 h-8 w-8 grid place-items-center rounded-full bg-surface-secondary text-fg-secondary"
                aria-label="Закрыть карту"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <MapView
                markers={[marker]}
                center={{ lat, lng }}
                zoom={16}
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
