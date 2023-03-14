import styled from "@emotion/styled";
import { Button, Modal, PasswordInput, TextInput } from "@mantine/core";
import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { closeModals, openLoginModal, openSignupModal, selectModal } from "../../store/ui";

const Container = styled.form`
    * {
        font-family: "Work Sans", sans-serif;
    }

    h2 {
        font-size: 1.5rem;
        font-weight: bold;
    }

    .mantine-TextInput-root, .mantine-PasswordInput-root {
        margin-top: 1rem;
    }
    
    .mantine-TextInput-root + .mantine-Button-root,
    .mantine-PasswordInput-root + .mantine-Button-root {
        margin-top: 1.618rem;
    }

    .mantine-Button-root {
        margin-top: 1rem;
    }

    label {
        margin-bottom: 0.25rem;
    }
`;

export function LoginModal(props: any) {
    const modal = useAppSelector(selectModal);
    const dispatch = useAppDispatch();

    const onClose = useCallback(() => dispatch(closeModals()), [dispatch]);
    const onCreateAccountClick = useCallback(() => dispatch(openSignupModal()), [dispatch]);

    return <Modal opened={modal === 'login'} onClose={onClose} withCloseButton={false}>
        <Container action="/chatapi/login" method="post">
            <h2>
                Sign in
            </h2>
            <input type="hidden" name="redirect_url" value={window.location.href} />
            <TextInput label="Email address"
                name="username"
                placeholder="Enter your email address"
                type="email"
                required />
            <PasswordInput label="Password"
                name="password"
                placeholder="Enter your password"
                maxLength={500}
                required />
            <Button fullWidth type="submit">
                Sign in
            </Button>
            <Button fullWidth variant="subtle" onClick={onCreateAccountClick}>
                Or create an account
            </Button>
        </Container>
    </Modal>
}

export function CreateAccountModal(props: any) {
    const modal = useAppSelector(selectModal);
    const dispatch = useAppDispatch();

    const onClose = useCallback(() => dispatch(closeModals()), [dispatch]);
    const onSignInClick = useCallback(() => dispatch(openLoginModal()), [dispatch]);

    return <Modal opened={modal === 'signup'} onClose={onClose} withCloseButton={false}>
        <Container action="/chatapi/register" method="post">
            <h2>
                Create an account
            </h2>
            <input type="hidden" name="redirect_url" value={window.location.href} />
            <TextInput label="Email address"
                name="username"
                placeholder="Enter your email address"
                type="email"
                required />
            <PasswordInput label="Password"
                name="password"
                placeholder="Enter your password"
                minLength={6}
                maxLength={500}
                required />
            <Button fullWidth type="submit">
                Sign up
            </Button>
            <Button fullWidth variant="subtle" onClick={onSignInClick}>
                Or sign in to an existing account
            </Button>
        </Container>
    </Modal>
}