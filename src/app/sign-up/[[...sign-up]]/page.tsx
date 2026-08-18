import { SignUp } from "@clerk/nextjs";
import { Container } from "@/components/ui/container";

export default function SignUpPage() {
  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#2340d9",
            fontFamily: "Nunito, system-ui, sans-serif",
            borderRadius: "0.75rem",
          },
        }}
      />
    </Container>
  );
}
