import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, getAdSlotHTML } from '../utils/common-ui.js';
import { createFaqAccordion, createBreadcrumbs } from '../utils/content-ui.js';

export const FAQ_ENTRIES = [
  {
    id: 'q1',
    category: 'General',
    question: 'What is SimpleTool and who is it for?',
    answer: 'SimpleTool is a comprehensive, privacy-first collection of web-based utilities designed specifically for developers, system administrators, and power users. Unlike many online tools that process your data on their servers, SimpleTool operates entirely client-side. This means that when you use our [JSON Formatter](/json-formatter) or [Hash Calculator](/hash-calculator), your sensitive data never leaves your browser. We leverage modern web technologies like the Web Crypto API and V8 isolates to ensure high performance without compromising your privacy. Our mission is to provide a "Swiss Army Knife" for the modern web that you can trust with your most sensitive configuration files, logs, and credentials. By keeping everything local, we eliminate the risk of data leaks, man-in-the-middle attacks on our backend, or unauthorized data collection. Whether you are debugging a complex [SAML assertion](/saml-decoder) or just need to [convert a timestamp](/timestamp-converter), SimpleTool provides a secure, fast, and accessible environment for your daily technical tasks.'
  },
  {
    id: 'q2',
    category: 'General',
    question: 'Is SimpleTool really free?',
    answer: 'Yes, SimpleTool is completely free for all users. We believe that essential developer utilities should be accessible to everyone without paywalls, subscriptions, or "freemium" limitations. To keep the service running and fund ongoing maintenance and development, we display non-intrusive third-party advertisements. These ads help cover our hosting costs on Cloudflare Workers and the time invested in building new features like the [Mermaid Studio](/mermaid-studio) or the [Regex Studio](/regex-visualizer). We strive to ensure that advertisements do not interfere with your workflow or compromise the clean, professional aesthetic of our tools. For users in enterprise environments who cannot have any third-party dependencies or ads, we also offer the option to self-host the entire platform. Since SimpleTool is open-source (MIT License), you can deploy your own instance internally, ensuring 100% control over your infrastructure while still benefiting from our powerful suite of tools like the [Log Viewer](/log-viewer) and [SSH Key Generator](/ssh-key-generator).'
  },
  {
    id: 'q3',
    category: 'General',
    question: 'Do I need to create an account?',
    answer: 'Absolutely not. One of the core pillars of SimpleTool is friction-less utility. You can access every single tool in our registry—from the [Password Generator](/password-generator) to the [IP Subnet Planner](/cidr-calculator)—without ever providing an email address, creating a password, or signing in. We do not track individual user profiles or maintain any server-side databases of user activity. This "no-account" policy is a deliberate security choice: if we don\'t have your data, we can\'t lose it in a breach. Your preferences, such as dark mode settings, are stored locally in your browser\'s session storage and are never synced to a cloud service. This makes SimpleTool ideal for quick, one-off tasks where you don\'t want to deal with the overhead of a login process. Just navigate to the tool you need, such as the [Unit Converter](/unit-converter) or [Text Case Converter](/case-converter), and start working immediately. We value your time and your privacy above all else.'
  },
  {
    id: 'q4',
    category: 'General',
    question: 'Is my data safe? How does client-side processing work?',
    answer: 'Your data is exceptionally safe because it never actually reaches our servers. SimpleTool is built on a "Zero Trust" architecture where all data processing happens locally within your browser\'s sandbox. When you paste a sensitive log into our [Log Masker](/log-masker) or upload a file to the [Hash Calculator](/hash-calculator), the computation is performed by your own CPU using JavaScript. We use the Web Crypto API for all cryptographic operations, ensuring that random values for our [UUID Generator](/uuid-generator) and [SSH Key Generator](/ssh-key-generator) are cryptographically secure. Furthermore, our Content Security Policy (CSP) is strictly configured to prevent unauthorized script execution and data exfiltration. While we use Cloudflare to serve the static assets and handle basic routing, the "Worker" logic is designed to be stateless. We don\'t have a backend database, and we don\'t log the content of your requests. For maximum security, we recommend using SimpleTool in an Incognito or Private browsing window to ensure no local traces are left behind.'
  },
  {
    id: 'q5',
    category: 'General',
    question: 'Which browsers are supported?',
    answer: 'SimpleTool is designed to work on all modern, evergreen browsers that support ES6+ JavaScript and the Web Crypto API. This includes the latest versions of Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge. We also support mobile browsers on iOS and Android, ensuring you can use tools like the [QR Code Studio](/qr-code) or [Color Converter](/color-converter) on the go. Because we rely on advanced browser features for tools like [Caffeniate](/caffeniate) (Wake Lock API) and the [Image Converter](/image-converter) (Canvas API), very old browsers like Internet Explorer are not supported. We prioritize performance and security, which often requires using modern web standards that older browsers lack. If you encounter any issues with a specific tool, such as the [Markdown Editor](/markdown-preview) or [Cron Builder](/cron-builder), we recommend updating your browser to the latest version. Our responsive design ensures that the interface adapts beautifully to any screen size, providing a consistent experience whether you are on a 4K monitor or a smartphone.'
  },
  {
    id: 'q6',
    category: 'General',
    question: 'Can I use SimpleTool offline?',
    answer: 'While SimpleTool is primarily a web-based application, many of its core functions are designed to work even if your internet connection is interrupted after the initial page load. Since all the logic for tools like the [Base64 Decoder](/universal-decoder) and [JSON Formatter](/json-formatter) is contained within the JavaScript files served to your browser, they do not need to "call home" to function. However, for a true offline experience, we recommend self-hosting the project. By cloning our repository and running it locally, you can have access to the entire suite—including the [SQL Formatter](/sql-formatter) and [Config Converter](/yaml-toml-converter)—without any internet access at all. This is particularly useful for developers working in secure, air-gapped environments or those who want to ensure zero external dependencies. We are also exploring Progressive Web App (PWA) features to allow for better caching and offline support in the future, making it even easier to keep your favorite utilities like the [Token Counter](/token-counter) ready at a moment\'s notice.'
  },
  {
    id: 'q7',
    category: 'Security & Cryptography',
    question: 'What makes a password truly secure?',
    answer: 'A truly secure password is characterized by high entropy, making it computationally expensive for an attacker to guess or crack. This involves using a combination of length (at least 12-16 characters) and a diverse character set, including uppercase and lowercase letters, numbers, and special symbols. However, randomness is the most critical factor. Human-generated passwords often follow predictable patterns, which is why using a tool like our [Password Generator](/password-generator) is essential. Our generator uses `crypto.getRandomValues()` to ensure that every character is selected with true cryptographic randomness. Beyond the password itself, security is enhanced by using unique credentials for every service, preventing a single data breach from compromising multiple accounts. For developers and sysadmins, we also recommend using public-key authentication via our [SSH Key Generator](/ssh-key-generator) whenever possible, as it provides a much higher level of security than even the strongest traditional passwords.'
  },
  {
    id: 'q8',
    category: 'Security & Cryptography',
    question: "What's the difference between MD5, SHA-256, and SHA-512?",
    answer: 'MD5, SHA-256, and SHA-512 are all cryptographic hash functions used to create digital "fingerprints" of data, but they differ significantly in security and output size. MD5 produces a 128-bit hash and is now considered cryptographically broken because it is vulnerable to collision attacks, where two different inputs produce the same hash. SHA-256 and SHA-512 are part of the SHA-2 family and are currently the industry standard for secure hashing. SHA-256 produces a 256-bit hash, while SHA-512 produces a 512-bit hash, offering even greater resistance to brute-force and collision attacks. While SHA-512 is technically more secure, SHA-256 is often preferred for its balance of security and performance in web applications. You can compute all of these hashes locally using our [Hash Calculator](/hash-calculator). For any new security-sensitive project, such as verifying file integrity or generating digital signatures, we strongly recommend using SHA-256 or SHA-512 over the outdated MD5.'
  },
  {
    id: 'q9',
    category: 'Security & Cryptography',
    question: 'Why is MD5 considered broken?',
    answer: 'MD5 is considered broken because researchers have discovered efficient ways to create "collisions"—situations where two different pieces of data result in the exact same hash value. In a secure hash function, this should be computationally impossible. Because collisions can be generated in seconds on a standard laptop, MD5 can no longer guarantee that a hash uniquely represents a specific input. This vulnerability allows attackers to create malicious files that appear to have the same "fingerprint" as a legitimate file. For example, a malicious software update could be crafted to match the MD5 hash of a valid update, tricking users into installing malware. While MD5 is still fine for non-security tasks like generating a unique key for a cache or checking for accidental data corruption, it should never be used for password hashing or verifying the authenticity of software. For those tasks, always use a modern algorithm like SHA-256, which you can easily compute using our [Hash Calculator](/hash-calculator).'
  },
  {
    id: 'q10',
    category: 'Security & Cryptography',
    question: 'What is HMAC and when should I use it?',
    answer: 'HMAC (Hash-based Message Authentication Code) is a specific type of message authentication code involving a cryptographic hash function and a secret cryptographic key. It is used to simultaneously verify both the data integrity and the authenticity of a message. While a standard hash (like those from our [Hash Calculator](/hash-calculator)) can tell you if data has changed, it cannot tell you who sent it. HMAC solves this by incorporating a secret key into the hashing process. If you receive a message and the HMAC matches what you calculate using the same secret key, you can be certain that the message was not altered and that it was sent by someone who possesses that key. HMAC is a fundamental building block of many secure protocols, including the signature part of [JSON Web Tokens (JWT)](/jwt-decoder). If you are building an API and need to ensure that requests are coming from authorized clients, implementing HMAC-SHA256 is a robust and widely accepted approach.'
  },
  {
    id: 'q11',
    category: 'Security & Cryptography',
    question: 'How does bcrypt compare to Argon2 for password hashing?',
    answer: 'When it comes to storing passwords in a database, you should never use a simple hash like SHA-256. Instead, you need a "slow" hash function designed to resist brute-force attacks. bcrypt has been the gold standard for many years; it is intentionally slow and includes a "salt" to prevent rainbow table attacks. However, Argon2 is the winner of the Password Hashing Competition (PHC) and is now considered the modern successor to bcrypt. Argon2 is superior because it is "memory-hard," meaning it requires a significant amount of RAM to compute, which makes it much harder to crack using specialized hardware like GPUs or ASICs. While our [Htpasswd Entry Generator](/htpasswd-generator) supports bcrypt for compatibility with web servers like Apache and Nginx, we recommend Argon2 for new application development. Both algorithms are designed to make the cost of guessing a password prohibitively expensive for attackers, providing a critical layer of defense for your user\'s credentials.'
  },
  {
    id: 'q12',
    category: 'Security & Cryptography',
    question: 'What is a JWT and when should I use one?',
    answer: 'A JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties. The claims in a JWT are encoded as a JSON object that is used as the payload of a JSON Web Signature (JWS) structure or as the plaintext of a JSON Web Encryption (JWE) structure, enabling the claims to be digitally signed or integrity protected with a Message Authentication Code (MAC) and/or encrypted. JWTs are most commonly used for authorization and information exchange in modern web applications. Once a user is logged in, each subsequent request will include the JWT, allowing the user to access routes, services, and resources that are permitted with that token. You can use our [JWT Inspector](/jwt-decoder) to safely decode and inspect the contents of a token locally. JWTs are ideal for stateless authentication, as the server does not need to maintain a session database; instead, it simply verifies the signature of the token provided by the client.'
  },
  {
    id: 'q13',
    category: 'Security & Cryptography',
    question: "How do I verify a file's integrity using hash checksums?",
    answer: 'Verifying file integrity is a critical security practice, especially when downloading software or sensitive data from the internet. A hash checksum is a unique alphanumeric string generated by running a file through a cryptographic algorithm like SHA-256. To verify a file, you first obtain the "official" checksum provided by the source. Then, you use our [Hash Calculator](/hash-calculator) to compute the checksum of the file you downloaded. If the two strings match exactly, you can be confident that the file has not been corrupted during transit or tampered with by a malicious actor. Even a single bit change in the file will result in a completely different hash value, a property known as the "avalanche effect." This process ensures that the data you are working with is exactly what the provider intended. For maximum security, always prefer SHA-256 or SHA-512 checksums over older formats like MD5, which are no longer considered secure against intentional tampering.'
  },
  {
    id: 'q14',
    category: 'Security & Cryptography',
    question: 'What is Content Security Policy (CSP) and why does it matter?',
    answer: 'Content Security Policy (CSP) is a security header that allows site operators to restrict the resources (such as JavaScript, CSS, Images) that a browser is allowed to load for a given page. It is one of the most effective defenses against Cross-Site Scripting (XSS) and data injection attacks. By defining a whitelist of trusted sources, you can prevent the browser from executing malicious scripts injected by an attacker, even if they find a vulnerability in your application. CSP also helps mitigate packet sniffing attacks by enforcing HTTPS for all resources. Building a robust CSP can be challenging due to the complexity of modern web apps, which is why we provide a [CSP Header Builder](/csp-builder). This tool helps you interactively configure directives like `script-src` and `style-src`, providing explanations for each and generating a valid header string. Implementing a strict CSP is a critical step in hardening your web application and protecting your users\' sensitive data from frontend-based threats.'
  },
  {
    id: 'q15',
    category: 'Data Formats',
    question: "What's the difference between JSON and YAML?",
    answer: 'JSON (JavaScript Object Notation) and YAML (YAML Ain\'t Markup Language) are the two most popular formats for data serialization and configuration. JSON is the de facto standard for web APIs due to its strict, predictable syntax, which makes it easy for machines to parse and generate. It is essentially a subset of JavaScript object literal syntax. YAML, on the other hand, is designed to be more human-readable and is frequently used for configuration files (like Kubernetes manifests or GitHub Actions). YAML supports comments and has a much cleaner look because it uses indentation instead of braces and commas. However, YAML\'s complexity can lead to subtle bugs, such as the "Norway problem" where the country code `NO` is interpreted as a boolean `false`. If you are building a public API, JSON is usually the safer bet. If you are writing configuration for humans, YAML is often preferred. Our [Config Converter](/yaml-toml-converter) allows you to easily switch between these formats, helping you bridge the gap between different systems.'
  },
  {
    id: 'q16',
    category: 'Data Formats',
    question: 'How do I validate JSON?',
    answer: 'Validating JSON is a common task for developers, as even a missing comma or an unquoted key can cause an entire application to crash. Our [JSON Formatter](/json-formatter) provides a real-time validator that highlights syntax errors as you type. Once your JSON is valid, the tool can "beautify" it by adding consistent indentation and line breaks, making complex nested structures much easier to read. Conversely, if you are preparing data for production, you can use the "minify" feature to remove all unnecessary whitespace, reducing the payload size for faster transmission. For more advanced use cases, such as ensuring that your JSON follows a specific structure or data type, you can use our [JSON Schema Studio](/json-schema-studio) to generate a schema from your data. This schema can then be used in your code to automatically validate incoming JSON, providing a robust defense against malformed data in your APIs.'
  },
  {
    id: 'q17',
    category: 'Data Formats',
    question: 'What is Base64 encoding and when is it used?',
    answer: 'Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format. It is most commonly used when you need to transmit binary data (like an image or a PDF) over media that are designed to handle only text, such as email (via MIME) or XML/JSON. By converting binary data into a set of 64 printable characters, Base64 ensures that the data remains intact without being modified by transport layers that might interpret certain binary sequences as control characters. It is also frequently used for "Data URIs" to embed small images directly into HTML or CSS. However, it is important to remember that Base64 is *not* encryption; it is easily reversible and provides no security. If you encounter a string that looks like random characters ending in one or two `=` signs, it is likely Base64. You can use our [Layered Decoder](/universal-decoder) to quickly decode it and see the original content, even if it has been encoded multiple times.'
  },
  {
    id: 'q18',
    category: 'Data Formats',
    question: 'What are regular expressions and why are they useful?',
    answer: 'Regular Expressions (Regex) are incredibly powerful for pattern matching and text manipulation, but they are notoriously difficult to read and debug. A single misplaced character can change the entire meaning of a pattern. Our [Regex Studio](/regex-visualizer) is designed to take the guesswork out of regex. When you enter a pattern, the tool generates a "railroad diagram"—a visual representation of the logic flow. It also provides a token-by-token explanation, breaking down exactly what each part of your regex (like `\\d+` or `(?<=...)`) is doing. You can then test your pattern against sample text with real-time highlighting of matches. This visual approach is much more intuitive than staring at a string of symbols. Whether you are validating an email address or parsing complex logs, our studio helps you build and audit your patterns with confidence. For those working with logs, you might also use these patterns in our [Log Masker](/log-masker) to identify and redact sensitive information.'
  },
  {
    id: 'q19',
    category: 'Data Formats',
    question: 'How do I convert between different timestamp formats?',
    answer: 'Converting between different timestamp formats is a frequent requirement when working with databases, APIs, and log files. The most common format is the Unix timestamp (or Epoch time), which represents the number of seconds elapsed since January 1, 1970. While machines love this integer format, humans need something more readable like ISO 8601 or a localized date string. Our [Timestamp Converter](/timestamp-converter) makes this transition seamless. You can paste a Unix timestamp to instantly see it converted into UTC and your local time zone, or you can input a human-readable date to generate the corresponding timestamp. We also support millisecond-precision timestamps, which are common in JavaScript and many modern logging systems. This tool is essential for debugging time-sensitive issues, such as checking when a specific event occurred in a log file or verifying the expiration time of a [JWT](/jwt-decoder).'
  },
  {
    id: 'q20',
    category: 'Data Formats',
    question: 'What is a UUID and when should I use one?',
    answer: 'A UUID (Universally Unique Identifier) is a 128-bit label used for information in computer systems. The main advantage of UUIDs is that they can be generated independently without a central authority, yet the probability of a duplicate being created is effectively zero. This makes them perfect for distributed systems where you need to assign unique IDs to database records, sessions, or transactions across multiple servers. The most common version is UUID v4, which is generated using random numbers. Our [UUID Generator](/uuid-generator) uses cryptographically secure random values to ensure that every ID you generate is truly unique. Using UUIDs instead of auto-incrementing integers in your database also provides a security benefit: it prevents "ID enumeration" attacks where a malicious user can guess other record IDs by simply incrementing a number. Whether you need a single ID for a test case or a batch for a migration, our tool provides them instantly in the standard 8-4-4-4-12 hex format.'
  },
  {
    id: 'q21',
    category: 'Data Formats',
    question: 'What is JSON Schema and why should I use it?',
    answer: 'JSON Schema is a powerful tool for validating the structure and content of JSON data. Think of it as a "blueprint" for your JSON. It allows you to define exactly which fields are required, what data types they should have (string, number, boolean, etc.), and even specific patterns they must match (like a regex for an email). By using JSON Schema, you can automate the validation of API requests and responses, ensuring that your application only processes data that meets your expectations. This prevents a whole class of bugs related to missing or malformed data. Writing a schema from scratch can be tedious, which is why our [JSON Schema Studio](/json-schema-studio) allows you to paste an example JSON object and automatically generate a matching schema. You can then refine this schema to add more constraints. It\'s an excellent way to document your data structures and provide a clear contract for other developers who are consuming your APIs.'
  },
  {
    id: 'q22',
    category: 'Data Formats',
    question: 'How do I compare two text files for differences?',
    answer: 'Comparing two versions of a file to find changes is a fundamental task in programming and system administration. Whether you are reviewing code changes, comparing configuration files, or checking for differences in two logs, our [Text Diff](/text-diff) tool makes it easy. You simply paste the two versions of the text into the side-by-side editors, and the tool instantly highlights the additions, deletions, and modifications. We use a sophisticated diffing algorithm that identifies changes at both the line and character level, providing a clear visual representation of the "delta." This is much more efficient than trying to spot differences manually. Our tool is entirely client-side, so you can safely compare sensitive files like `.env` configurations or private keys without worrying about them being uploaded. For developers, this is a quick and easy alternative to running `git diff` in the terminal, especially when working with snippets of text that aren\'t yet part of a repository.'
  },
  {
    id: 'q23',
    category: 'Networking & Web',
    question: 'How do CIDR subnets and IP ranges work?',
    answer: 'CIDR (Classless Inter-Domain Routing) is a method for allocating IP addresses and routing Internet Protocol packets. It replaced the older "classful" network architecture (Class A, B, C) with a more flexible system. A CIDR address looks like `192.168.1.0/24`. The number after the slash (the "prefix") indicates how many bits are used for the network portion of the address, with the remaining bits used for host addresses. For example, a `/24` prefix means 24 bits are for the network, leaving 8 bits for hosts, which allows for 256 addresses (254 usable hosts). Understanding these ranges is crucial for setting up VPCs, firewalls, and routing tables. Our [IP Subnet Planner](/cidr-calculator) simplifies this by calculating the network address, broadcast address, subnet mask, and the full range of usable IP addresses for any CIDR block. It also supports IPv6, helping you navigate the much larger address space of the next-generation internet protocol. Whether you are a network engineer or a developer setting up a cloud environment, this tool takes the math out of subnetting.'
  },
  {
    id: 'q24',
    category: 'Networking & Web',
    question: 'What information does a User-Agent string contain?',
    answer: 'A User-Agent string is a line of text that your browser sends to every website you visit. it identifies the browser name, version, operating system, and even the device type to the web server. Servers use this information to serve the correct version of a site (e.g., mobile vs. desktop) or to block outdated and insecure browsers. However, User-Agent strings are notoriously messy and difficult to parse because they often contain "spoofed" information for compatibility reasons (e.g., almost every browser includes "Mozilla/5.0"). Our [User-Agent Parser](/user-agent-decoder) breaks down these complex strings into a clean, structured format. It identifies the rendering engine (like WebKit or Gecko), the OS version, and even specific features of the device. This is incredibly useful for web developers debugging cross-browser issues or for security analysts investigating suspicious traffic in their logs. By understanding exactly what a User-Agent is claiming to be, you can better understand the landscape of users visiting your application.'
  },
  {
    id: 'q25',
    category: 'Networking & Web',
    question: 'How do I use cURL to debug APIs?',
    answer: 'cURL is a powerful command-line tool for transferring data with URLs. It is the industry standard for testing APIs because it supports almost every protocol and allows for precise control over headers, cookies, and request bodies. However, building a complex cURL command with multiple headers and a JSON body can be error-prone. Our [Curl Studio](/curl-studio) provides a visual interface for building and parsing these commands. You can paste an existing cURL command to see it broken down into its component parts, or you can use our form to build a new request from scratch. The tool then generates the correct cURL syntax for you to copy and paste into your terminal. This is a great way to learn cURL syntax and to ensure that your API requests are formatted correctly. It\'s also useful for sharing API examples with teammates in a format that they can immediately run. Combined with our [JSON Formatter](/json-formatter), it\'s a complete toolkit for modern API development.'
  },
  {
    id: 'q26',
    category: 'Networking & Web',
    question: 'What is SAML and how does SSO work?',
    answer: 'SAML (Security Assertion Markup Language) is an XML-based standard for exchanging authentication and authorization data between parties, typically an Identity Provider (IdP) and a Service Provider (SP). It is the backbone of many Enterprise Single Sign-On (SSO) systems. SAML requests and responses are typically Base64 encoded and often deflated, making them impossible to read in their raw form. When an SSO login fails, you often need to inspect the "SAML Assertion" to see what attributes are being sent and if the signatures are valid. Our [SAML Inspector](/saml-decoder) automates this process. You can paste the encoded SAML blob, and the tool will decode, inflate, and format the XML for you. It highlights key information like the `Subject`, `Issuer`, and `Conditions`, making it much easier to spot configuration errors like mismatched entity IDs or expired certificates. Because SAML often contains sensitive user data, our local-only processing ensures that your enterprise credentials never leave your secure environment.'
  },
  {
    id: 'q27',
    category: 'Networking & Web',
    question: 'What are SPF, DKIM, and DMARC in email security?',
    answer: 'SPF, DKIM, and DMARC are three email authentication methods that work together to prevent spoofing and phishing. SPF (Sender Policy Framework) allows a domain owner to specify which mail servers are authorized to send email on their behalf. DKIM (DomainKeys Identified Mail) adds a digital signature to emails, allowing the receiver to verify that the email was indeed authorized by the owner of that domain and that it wasn\'t altered in transit. DMARC (Domain-based Message Authentication, Reporting, and Conformance) ties SPF and DKIM together by providing instructions to the receiving mail server on what to do if an email fails authentication (e.g., "reject it" or "put it in spam"). Debugging these can be difficult, which is why we created the [Email Security Analyzer](/email-analyzer). You can paste the raw headers of an email, and our tool will parse them to show you the status of these checks, along with the routing hops the email took. It\'s an essential tool for anyone managing mail servers or investigating suspicious emails.'
  },
  {
    id: 'q28',
    category: 'Developer Productivity',
    question: 'How do I estimate API token costs for LLMs?',
    answer: 'Large Language Models (LLMs) like GPT-4 and Claude don\'t process text word-by-word; they use "tokens," which are chunks of characters. A rule of thumb is that 1,000 tokens is roughly 750 words. Because providers charge based on the number of tokens in both your prompt and the model\'s response, understanding your token usage is critical for managing costs. Our [Token Counter & Cost Estimator](/token-counter) helps you do exactly this. You can paste your text and see an estimate of the token count for different models. You can also input the specific pricing for your provider to see a real-time cost calculation. This is incredibly useful for developers building AI-powered applications who need to stay within a budget or for users who want to optimize their prompts for efficiency. By seeing how different phrasing affects the token count, you can learn to write more concise and cost-effective prompts. It\'s a simple way to bring transparency to the often-opaque world of AI pricing.'
  },
  {
    id: 'q29',
    category: 'Developer Productivity',
    question: 'What is a cron expression and how do I write one?',
    answer: 'Cron is a time-based job scheduler in Unix-like operating systems. It uses a specific string format (e.g., `0 0 * * *`) to define when a task should run. While powerful, these expressions are notoriously difficult to remember and easy to get wrong. A single mistake can mean your backup runs every minute instead of once a day. Our [Cron Builder](/cron-builder) provides a visual, human-friendly way to create these schedules. Instead of memorizing the syntax, you can use simple dropdowns to select the minutes, hours, days, and months. As you make changes, the tool provides a plain-English description of the schedule (e.g., "At 12:00 AM, every day") and shows you the next five scheduled run times. This immediate feedback ensures that your cron job will run exactly when you expect it to. Once you\'re happy with the schedule, you can copy the generated cron expression directly into your crontab or configuration file. It\'s a must-have tool for any developer or sysadmin managing scheduled tasks.'
  },
  {
    id: 'q30',
    category: 'Developer Productivity',
    question: 'How do I create effective prompt templates for AI?',
    answer: 'As AI becomes a bigger part of the developer workflow, managing "prompts" has become a new challenge. A prompt template is a reusable structure for interacting with an LLM, often containing placeholders for dynamic data. For example, a template for summarizing code might look like: "Summarize the following {{language}} code: {{code}}". Using templates ensures consistency in the model\'s output and makes it easier to integrate AI into your applications. Our [Prompt Template Builder](/prompt-template-builder) allows you to create, test, and manage these templates. You can define variables, set system instructions, and even add "guardrails" to prevent the model from going off-track. The tool provides a clean interface for filling in your variables and seeing the final prompt that will be sent to the model. This is much more organized than keeping a collection of text files. Whether you are building a chatbot or just want to streamline your own use of AI, our builder helps you treat your prompts like code—versioned, structured, and reusable.'
  }
];

function renderFaqShell({ title, description, content, schema }) {
  const html = createPageTemplate({
    title,
    description,
    content,
    path: '/faq',
    schema
  });

  const toolAdSlot = getAdSlotHTML('tool', {
    wrapperClassName: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
  });

  const htmlWithoutToolSlot = toolAdSlot ? html.replace(toolAdSlot, '') : html;
  return respondHTML(htmlWithoutToolSlot);
}

export function renderFaqPage() {
  const breadcrumbs = createBreadcrumbs([
    { label: 'Home', url: '/' },
    { label: 'FAQ' }
  ]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': FAQ_ENTRIES.map(entry => ({
      '@type': 'Question',
      'name': entry.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': entry.answer
      }
    }))
  };

  const categories = [...new Set(FAQ_ENTRIES.map(e => e.category))];
  const groupedContent = categories.map(cat => {
    const items = FAQ_ENTRIES.filter(e => e.category === cat);
    return `
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4" data-i18n="content.faq.cat.${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${cat}</h2>
        ${createFaqAccordion(items)}
      </section>`;
  }).join('');

  const faqContent = FAQ_ENTRIES.length > 0
    ? groupedContent
    : `
      <div class="text-center py-16">
        <p class="text-surface-500 dark:text-surface-400 text-sm" data-i18n="content.faq.empty">FAQ entries coming soon. Check back for answers to common questions about our tools.</p>
      </div>
    `;

  const content = `
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      ${breadcrumbs}
      <div class="card p-6 sm:p-10">
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50" data-i18n="content.faq.heading">Frequently Asked Questions</h1>
          <p class="mt-2 text-sm text-surface-500 dark:text-surface-400" data-i18n="content.faq.subheading">Common questions about SimpleTool and our developer tools.</p>
        </header>

        ${faqContent}
      </div>

      ${getAdSlotHTML('legal', { wrapperClassName: 'mt-10' })}
    </main>
    <script>
      (function(){
        function openAnchor() {
          var hash = window.location.hash;
          if (!hash) return;
          var el = document.querySelector(hash);
          if (el && el.tagName === 'DETAILS') {
            el.setAttribute('open', '');
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        openAnchor();
        window.addEventListener('hashchange', openAnchor);
      })();
    </script>
  `;

  return renderFaqShell({
    title: 'FAQ',
    description: 'Frequently asked questions about SimpleTool — privacy-first developer tools.',
    content,
    schema: faqSchema
  });
}

export function handleFaqRoutes(request, url) {
  const pathname = url.pathname.replace(/\/+$/, '') || '/faq';

  if (pathname === '/faq' && request.method === 'GET') {
    return renderFaqPage();
  }

  return null;
}
