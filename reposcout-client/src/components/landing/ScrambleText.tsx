import { useState, useEffect } from 'react';

interface ScrambleTextProps {
    text: string;
    className?: string;
}

export const ScrambleText = ({ text, className }: ScrambleTextProps) => {
    const [displayText, setDisplayText] = useState('');
    const chars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    useEffect(() => {
        let iteration = 0;
        let interval: ReturnType<typeof setInterval>;

        interval = setInterval(() => {
            setDisplayText(
                text
                    .split('')
                    .map((_letter, index) => {
                        if (index < iteration) return text[index];
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('')
            );

            if (iteration >= text.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);

        return () => clearInterval(interval);
    }, [text]);

    return <span className={className}>{displayText}</span>;
};