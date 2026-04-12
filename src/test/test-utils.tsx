import { render, type RenderOptions } from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
}

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

export { customRender as render };
export { screen, waitFor } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
