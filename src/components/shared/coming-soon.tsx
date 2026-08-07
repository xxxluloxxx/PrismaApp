import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ComingSoon({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{title}</CardTitle>
          <CardDescription>
            Módulo pendiente — se implementa en {phase}.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
