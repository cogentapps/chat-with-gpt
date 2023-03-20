import styled from '@emotion/styled';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Button, CopyButton } from '@mantine/core';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const Code = styled.div`
    padding: 0;
    border-radius: 0.25rem;
    overflow: hidden;

    &>div {
        margin: 0 !important;
    }

    .fa {
        font-style: normal !important;
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    background: #191919;
    height: 2.5rem;
    padding: 0.1rem 0.1rem 0 0.5rem;

    .mantine-Button-label {
        display: flex;
        align-items: center;

        * {
            font-size: 90%;
        }
    }
`;

const ImagePreview = styled.div`
    text-align: center;

    img {
        max-width: 30rem !important;
        display: block;
    }
`;

export interface MarkdownProps {
    content: string;
    className?: string;
}

export function Markdown(props: MarkdownProps) {
    const intl = useIntl();

    const classes = useMemo(() => {
        const classes = ['prose', 'dark:prose-invert'];

        if (props.className) {
            classes.push(props.className);
        }

        return classes;
    }, [props.className])

    const elem = useMemo(() => (
        <div className={classes.join(' ')}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    ol({ start, children }) {
                        return <ol start={start ?? 1} style={{ counterReset: `list-item ${(start || 1) - 1}` }}>
                            {children}
                        </ol>;
                    },
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const code = String(children);
                        return !inline ? (<>
                            <Code>
                                <Header>
                                    {code.startsWith('<svg') && code.includes('</svg>') && (
                                        <Button variant="subtle" size="sm" compact onClick={() => {
                                            const blob = new Blob([code], { type: 'image/svg+xml' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'image.svg';
                                            a.click();
                                        }}>
                                            <i className="fa fa-download" />
                                            <span><FormattedMessage defaultMessage="Download SVG" /></span>
                                        </Button>
                                    )}
                                    <CopyButton value={code}>
                                        {({ copy, copied }) => (
                                            <Button variant="subtle" size="sm" compact onClick={copy}>
                                                <i className="fa fa-clipboard" />
                                                <span>
                                                    {copied ? <FormattedMessage defaultMessage="Copied" description="Label for copy-to-clipboard button after a successful copy" />
                                                        : <FormattedMessage defaultMessage="Copy" description="Label for copy-to-clipboard button" />}
                                                </span>
                                            </Button>
                                        )}
                                    </CopyButton>
                                </Header>
                                <SyntaxHighlighter
                                    children={code}
                                    style={vscDarkPlus as any}
                                    language={match?.[1] || 'text'}
                                    PreTag="div"
                                    {...props} />
                            </Code>
                            {code.startsWith('<svg') && code.includes('</svg>') && (
                                <ImagePreview>
                                    <img src={`data:image/svg+xml;base64,${btoa(code)}`} />
                                </ImagePreview>
                            )}
                        </>) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        )
                    }
                }}>{props.content}</ReactMarkdown>
        </div>
    ), [props.content, classes, intl]);

    return elem;
}
