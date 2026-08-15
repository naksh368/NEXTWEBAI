import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-6">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-4 h-[300px] w-full rounded-2xl sm:h-[420px]" />
      <Skeleton className="mt-6 h-8 w-2/3 max-w-md" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    </Container>
  );
}
