export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'ios-checkbox rounded border-slate-600 bg-white/10 text-emerald-300 shadow-sm focus:ring-emerald-300 ' +
                className
            }
        />
    );
}
