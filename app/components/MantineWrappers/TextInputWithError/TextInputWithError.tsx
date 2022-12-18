import { TextInput } from "@mantine/core";

export function TextInputWithError() {
    return (
        <div>
            <TextInput
                name="firstName"
                label="Primeiro nome"
                type="text"
                sx={(theme) => ({
                    marginBottom: theme.spacing.md,
                })}
            />
            <div className="errorMessage"></div>
        </div>
    );
}
