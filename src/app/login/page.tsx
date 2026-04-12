import { signIn } from "@/auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>Sign in to AdForge</CardTitle>
            <CardDescription>
              Create AI-powered video ads for your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <Button type="submit" className="w-full" size="lg">
                Sign in with Google
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
