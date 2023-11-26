class Config {
	constructor() {
		this.site_name = 'Magic Matching';

		// Set defaults and read from environment variables
		this.mode = Deno.env.get('MODE') || 'production';

		this.openai_key = Deno.env.get('OPENAI_API_KEY') || '';

		this.db_url = Deno.env.get('SUPABASE_DB_URL') || '';

		// Check if essential environment variables are set
		if (!this.openai_key) {
			throw new Error("OPENAI_API_KEY environment variable is not set");
		}
		if (!this.db_url) {
			throw new Error("SUPABASE_DB_URL environment variable is not set");
		}
	}

	// Method to set the application mode
	setMode(mode) {
		if (Object.isFrozen(this)) {
			throw new Error("Config instance is frozen, cannot change mode");
		}
		this.mode = mode;
		// additional logic to change other properties based on mode
	}
}

// Create a singleton instance
const configInstance = new Config();

// Consider the implications of freezing the object
Object.freeze(configInstance);

export default configInstance;
