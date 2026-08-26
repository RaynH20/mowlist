import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase"; // adjust import path as per your directory
import { useAuth } from "@/lib/auth-context"; // adjust import path as per your directory
import { toast } from "sonner";
import { Play, Square, Navigation, Wifi, WifiOff } from "lucide-react";

export function StandbyToggle() {
  const { user } = useAuth();
  const [isOnStandby, setIsOnStandby] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [trackingActive, setTrackingActive] = useState<boolean>(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch current standby status from database on mount
  useEffect(() => {
    async function fetchStandbyStatus() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("provider_profiles")
          .select("is_on_standby")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (data) {
          setIsOnStandby(data.is_on_standby || false);
        }
      } catch (error: any) {
        console.error("Error fetching standby status:", error);
        toast.error("Failed to load standby status");
      } finally {
        setLoading(false);
      }
    }

    fetchStandbyStatus();
  }, [user?.id]);

  // 2. Core tracking and heartbeat logic
  useEffect(() => {
    if (isOnStandby) {
      // Start the heartbeat tracking immediately
      sendLocationPing();
      
      // Ping location every 30 seconds
      heartbeatIntervalRef.current = setInterval(() => {
        sendLocationPing();
      }, 30000);

      setTrackingActive(true);
    } else {
      // Clean up heartbeat when toggled off
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      setTrackingActive(false);
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [isOnStandby]);

  // 3. Geolocation fetch and database update
  async function sendLocationPing() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          if (!user?.id) return;

          // A. Update provider_profiles with last heartbeat, lat, and lng
          const { error: profileError } = await supabase
            .from("provider_profiles")
            .update({
              last_lat: latitude,
              last_lng: longitude,
              last_heartbeat_at: new Date().toISOString(),
              is_on_standby: true,
            })
            .eq("user_id", user.id);

          if (profileError) throw profileError;

          // B. Write to pro_location_pings table for real-time tracking history
          const { error: pingError } = await supabase
            .from("pro_location_pings")
            .insert({
              provider_id: user.id,
              lat: latitude,
              lng: longitude,
              accuracy_meters: accuracy || 10,
              recorded_at: new Date().toISOString(),
            });

          if (pingError) throw pingError;

          console.log(`[Location Heartbeat] Lat: ${latitude}, Lng: ${longitude}`);
        } catch (dbError: any) {
          console.error("Error writing location coordinates to Supabase:", dbError);
        }
      },
      (geoError) => {
        console.error("Geolocation watch error:", geoError);
        let errorMsg = "Could not access location";
        if (geoError.code === 1) {
          errorMsg = "Please allow location access to go on standby";
        }
        toast.error(errorMsg);
        // Force standby off if browser blocks GPS tracking
        handleToggle(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // 4. Handle user toggling "Standby Mode"
  async function handleToggle(targetState: boolean) {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Update DB state
      const { error } = await supabase
        .from("provider_profiles")
        .update({
          is_on_standby: targetState,
          standby_started_at: targetState ? new Date().toISOString() : null,
          last_heartbeat_at: targetState ? new Date().toISOString() : null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setIsOnStandby(targetState);
      
      if (targetState) {
        toast.success("You are now ON STANDBY! Open for immediate jobs.", {
          icon: <Wifi className="h-5 w-5 text-emerald-500 animate-pulse" />,
        });
      } else {
        toast.info("Offline. You will no longer receive immediate match offers.", {
          icon: <WifiOff className="h-5 w-5 text-red-500" />,
        });
      }
    } catch (error: any) {
      console.error("Error updating standby toggle:", error);
      toast.error("Failed to update standby status");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !isOnStandby) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 bg-slate-800 rounded-full animate-pulse border border-slate-700">
        <Navigation className="h-4 w-4 animate-spin" />
        Syncing...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={() => handleToggle(!isOnStandby)}
        disabled={loading}
        className={`relative flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border shadow-sm font-semibold text-sm transition-all duration-300 select-none ${
          isOnStandby
            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-emerald-100/50"
            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
        } ${loading ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2">
          {isOnStandby ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>On Standby</span>
            </>
          ) : (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
              <span>Go Standby</span>
            </>
          )}
        </div>

        <div
          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
            isOnStandby ? "bg-emerald-500" : "bg-slate-300"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
              isOnStandby ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </button>

      {trackingActive && (
        <span className="text-[10px] text-slate-500 font-medium px-2 flex items-center gap-1">
          <Navigation className="h-3 w-3 animate-bounce text-emerald-600" />
          Broadcasting live location to Wilkes-Barre dispatch...
        </span>
      )}
    </div>
  );
}
