export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            className={'ios-form-error text-sm text-rose-400 ' + className}
        >
            {message}
        </p>
    ) : null;
}
