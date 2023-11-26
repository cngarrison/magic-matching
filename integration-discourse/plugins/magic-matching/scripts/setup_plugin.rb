#!/src/bin/rails runner

# Check for '--force' argument
force = ARGV.include?('--force')

begin

	Rails.logger.error("== Running with the force - do the setup") if force
  PluginStore.set("magic_matching", "is_initialized", false) if force

	MagicMatching::Setup.setup_plugin()

rescue => e
	Rails.logger.error("== An error occurred: #{e.message}")
end
