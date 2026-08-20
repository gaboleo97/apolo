import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function ModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description ?? "Módulo en construcción."}
        </Typography>
      </Box>
    </Box>
  );
}
