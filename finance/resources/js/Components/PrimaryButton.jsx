export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `bubble-button bubble-button-primary ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
