export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `ios-form-label block text-xs font-semibold text-slate-400 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
