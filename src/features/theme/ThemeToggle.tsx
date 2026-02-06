import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeContext"
import { motion } from "framer-motion"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border border-border overflow-hidden hover:bg-muted transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
            title="Toggle Theme"
        >
            <motion.div
                initial={false}
                animate={{
                    rotate: isDark ? 0 : 90,
                    scale: isDark ? 1 : 0,
                    opacity: isDark ? 1 : 0
                }}
                transition={{ duration: 0.2 }}
                className="absolute"
            >
                <Moon className="h-4 w-4" />
            </motion.div>

            <motion.div
                initial={false}
                animate={{
                    rotate: isDark ? -90 : 0,
                    scale: isDark ? 0 : 1,
                    opacity: isDark ? 0 : 1
                }}
                transition={{ duration: 0.2 }}
                className="absolute"
            >
                <Sun className="h-4 w-4" />
            </motion.div>
        </button>
    )
}
