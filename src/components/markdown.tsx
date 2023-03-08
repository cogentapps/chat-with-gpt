import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Button, CopyButton } from '@mantine/core';

export interface MarkdownProps {
    content: string;
    className?: string;
}

export function Markdown(props: MarkdownProps) {
    const classes = ['prose', 'dark:prose-invert'];
    
    if (props.className) {
        classes.push(props.className);
    }

    return (
        <div className={classes.join(' ')}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline ? (
                            <div>
                                <CopyButton value={String(children)}>
                                    {({ copy, copied }) => (
                                        <Button variant="subtle" size="sm" compact onClick={copy}>
                                            <i className="fa fa-clipboard" />
                                            <span>{copied ? 'Copied' : 'Copy'}</span>
                                        </Button>
                                    )}
                                </CopyButton>
                                <SyntaxHighlighter
                                    children={String(children).replace(/\n$/, '')}
                                    style={vscDarkPlus as any}
                                    language={match?.[1] || 'text'}
                                    PreTag="div"
                                    {...props}
                                />
                            </div>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        )
                    }
                }}>{props.content}</ReactMarkdown>
        </div>
    );
}