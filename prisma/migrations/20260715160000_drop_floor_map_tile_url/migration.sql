-- Custom per-floor map tiles were never wired into the mobile MapLibre style
-- (the app uses OpenFreeMap for outdoor GPS). Drop the unused column; indoor
-- floor plans can reintroduce a dedicated field when that work starts.
ALTER TABLE "Floor" DROP COLUMN "mapTileUrl";
