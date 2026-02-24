// Returns initials from string
export const getInitials = (value: string) => value.split(/\s/).reduce((response, word) => (response += word.slice(0, 1)), '')
