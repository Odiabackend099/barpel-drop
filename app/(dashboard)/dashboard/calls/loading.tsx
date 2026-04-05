import { Skeleton } from "@/components/ui/skeleton";

export default function CallsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-12 w-full rounded-xl" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}
