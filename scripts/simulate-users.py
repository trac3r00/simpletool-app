#!/usr/bin/env python3
"""
User Simulation Script for SimpleTool App
Simulates 15,000 real users with different personas against local server.
"""

import asyncio
import aiohttp
import random
import time
import json
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
from collections import defaultdict
from urllib.parse import urljoin, quote
import sys

# Try to import tqdm for progress bar
try:
    from tqdm.asyncio import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    print("Note: Install tqdm for progress bars: pip install tqdm")


@dataclass
class UserAction:
    """Represents a single user action/page visit"""
    url: str
    method: str = "GET"
    data: Dict = None
    headers: Dict = None


@dataclass
class RequestResult:
    """Result of a single HTTP request"""
    url: str
    status: int
    response_time: float
    size: int
    error: str = None
    headers: Dict = field(default_factory=dict)


@dataclass
class PersonaStats:
    """Statistics for a persona type"""
    count: int = 0
    total_requests: int = 0
    response_times: List[float] = field(default_factory=list)
    status_codes: Dict[int, int] = field(default_factory=lambda: defaultdict(int))
    errors: List[str] = field(default_factory=list)


class UserSimulator:
    """Main simulation orchestrator"""

    BASE_URL = "http://localhost:8787"

    # All available tool paths
    TOOL_PATHS = [
        "/", "/json-formatter", "/jwt-decoder", "/uuid-generator",
        "/password-generator", "/hash-calculator", "/cidr-calculator",
        "/text-diff", "/regex-visualizer", "/universal-decoder",
        "/cron-builder", "/ssh-key-generator", "/certificate-decoder",
        "/saml-decoder", "/user-agent-decoder", "/qr-code",
        "/timestamp-converter", "/color-converter", "/unit-converter",
        "/yaml-toml-converter", "/htpasswd-generator", "/mock-data-generator",
        "/markdown-preview", "/log-viewer", "/case-converter",
        "/code-minifier", "/image-converter", "/css-gradient",
        "/curl-studio", "/log-masker", "/mermaid-studio",
        "/json-schema-studio", "/caffeniate"
    ]

    # Other valid paths
    OTHER_PATHS = [
        "/ads.txt", "/robots.txt", "/sitemap.xml",
        "/.well-known/security.txt", "/health", "/terms",
        "/privacy", "/about", "/contact", "/security",
        "/careers", "/styles.css", "/favicon.ico"
    ]

    # Persona distribution (weights)
    PERSONAS = {
        "dumb": 0.15,
        "entry": 0.20,
        "moderate": 0.25,
        "advanced": 0.20,
        "professional": 0.10,
        "engineer": 0.07,
        "crawler/bot": 0.03
    }

    # Security test payloads
    XSS_PAYLOADS = [
        "<script>alert(1)</script>",
        "javascript:alert(1)",
        "<img src=x onerror=alert(1)>",
        "';alert(1);//",
        "<svg/onload=alert(1)>"
    ]

    SQL_INJECTION_PAYLOADS = [
        "' OR '1'='1",
        "1; DROP TABLE users--",
        "admin'--",
        "' UNION SELECT NULL--"
    ]

    def __init__(self, total_simulations: int = 15000, concurrency: int = 50):
        self.total_simulations = total_simulations
        self.concurrency = concurrency
        self.semaphore = asyncio.Semaphore(concurrency)

        # Statistics
        self.persona_stats: Dict[str, PersonaStats] = {
            persona: PersonaStats() for persona in self.PERSONAS.keys()
        }
        self.all_results: List[RequestResult] = []
        self.page_metrics: Dict[str, List[float]] = defaultdict(list)
        self.broken_links: List[Tuple[str, int]] = []
        self.security_header_checks: List[bool] = []
        self.start_time: float = 0
        self.end_time: float = 0

    def select_persona(self) -> str:
        """Randomly select a persona based on weighted distribution"""
        return random.choices(
            list(self.PERSONAS.keys()),
            weights=list(self.PERSONAS.values())
        )[0]

    def get_user_agent(self, persona: str) -> str:
        """Get appropriate user agent for persona"""
        if persona == "crawler/bot":
            return random.choice([
                "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
                "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)"
            ])
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    def generate_actions_for_persona(self, persona: str) -> List[UserAction]:
        """Generate list of actions based on persona type"""
        actions = []

        if persona == "dumb":
            # 2-5 random actions, lots of mistakes
            num_actions = random.randint(2, 5)
            for _ in range(num_actions):
                path = random.choice(self.TOOL_PATHS + ["/random-nonsense", "/asdfgh", "/tool123"])
                # Add random query params with typos
                if random.random() > 0.5:
                    typo_param = random.choice(["serch", "qery", "inpt", "dta"])
                    typo_value = random.choice(["asdf", "1234", "test test", "???"])
                    path += f"?{typo_param}={quote(typo_value)}"
                actions.append(UserAction(path))

        elif persona == "entry":
            # 1-3 basic actions
            num_actions = random.randint(1, 3)
            # Start with home
            actions.append(UserAction("/"))
            # Visit 1-2 simple tools
            simple_tools = ["/uuid-generator", "/password-generator", "/timestamp-converter"]
            for tool in random.sample(simple_tools, min(num_actions - 1, len(simple_tools))):
                actions.append(UserAction(tool))

        elif persona == "moderate":
            # 3-5 tools, some exploration
            num_actions = random.randint(3, 5)
            actions.append(UserAction("/"))
            tools = random.sample(self.TOOL_PATHS[1:], min(num_actions - 1, len(self.TOOL_PATHS) - 1))
            for tool in tools:
                actions.append(UserAction(tool))
                # Sometimes add search
                if random.random() > 0.7:
                    search_query = random.choice(["json", "hash", "generator", "converter"])
                    actions.append(UserAction(f"/?search={search_query}"))

        elif persona == "advanced":
            # 5-8 tools, test features
            num_actions = random.randint(5, 8)
            actions.append(UserAction("/"))
            tools = random.sample(self.TOOL_PATHS[1:], min(num_actions - 1, len(self.TOOL_PATHS) - 1))
            for tool in tools:
                actions.append(UserAction(tool))
                # Test with parameters
                if random.random() > 0.5:
                    test_params = random.choice([
                        "?input=test123",
                        "?data=sample",
                        "?theme=dark",
                        "?format=json"
                    ])
                    actions.append(UserAction(tool + test_params))

        elif persona == "professional":
            # 8-12 tools, systematic testing
            num_actions = random.randint(8, 12)
            actions.append(UserAction("/"))
            # Visit many tools systematically
            tools = random.sample(self.TOOL_PATHS[1:], min(num_actions - 1, len(self.TOOL_PATHS) - 1))
            for tool in tools:
                actions.append(UserAction(tool))
                # Test different inputs
                actions.append(UserAction(tool + "?input=small"))
                actions.append(UserAction(tool + "?input=" + "large" * 100))

        elif persona == "engineer":
            # Security and stress testing
            num_actions = random.randint(10, 15)
            actions.append(UserAction("/"))

            # Test some tools normally
            tools = random.sample(self.TOOL_PATHS[1:], 3)
            for tool in tools:
                actions.append(UserAction(tool))

            # Security tests
            for payload in random.sample(self.XSS_PAYLOADS, 2):
                test_path = random.choice(self.TOOL_PATHS)
                actions.append(UserAction(f"{test_path}?input={quote(payload)}"))

            for payload in random.sample(self.SQL_INJECTION_PAYLOADS, 2):
                test_path = random.choice(self.TOOL_PATHS)
                actions.append(UserAction(f"{test_path}?search={quote(payload)}"))

            # Test error handling
            actions.append(UserAction("/nonexistent-page"))
            actions.append(UserAction("/json-formatter?data=" + "x" * 10000))

            # Check headers
            actions.append(UserAction("/health"))
            actions.append(UserAction("/.well-known/security.txt"))

        elif persona == "crawler/bot":
            # Bot-like sequential crawling
            actions.append(UserAction("/robots.txt"))
            actions.append(UserAction("/sitemap.xml"))
            actions.append(UserAction("/ads.txt"))
            actions.append(UserAction("/"))

            # Rapid sequential page fetches
            for path in random.sample(self.TOOL_PATHS, min(10, len(self.TOOL_PATHS))):
                actions.append(UserAction(path))

        return actions

    async def execute_request(
        self,
        session: aiohttp.ClientSession,
        action: UserAction
    ) -> RequestResult:
        """Execute a single HTTP request and return result"""
        url = urljoin(self.BASE_URL, action.url)
        headers = action.headers or {}

        start = time.time()
        try:
            async with session.request(
                action.method,
                url,
                headers=headers,
                data=action.data,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                # Read response body to get size
                body = await response.read()
                response_time = time.time() - start

                return RequestResult(
                    url=action.url,
                    status=response.status,
                    response_time=response_time,
                    size=len(body),
                    headers=dict(response.headers)
                )
        except asyncio.TimeoutError:
            return RequestResult(
                url=action.url,
                status=0,
                response_time=time.time() - start,
                size=0,
                error="Timeout"
            )
        except aiohttp.ClientError as e:
            return RequestResult(
                url=action.url,
                status=0,
                response_time=time.time() - start,
                size=0,
                error=str(e)
            )
        except Exception as e:
            return RequestResult(
                url=action.url,
                status=0,
                response_time=time.time() - start,
                size=0,
                error=f"Unexpected error: {str(e)}"
            )

    async def simulate_user_session(
        self,
        session: aiohttp.ClientSession,
        user_id: int
    ):
        """Simulate a single user session"""
        async with self.semaphore:
            # Select persona
            persona = self.select_persona()
            stats = self.persona_stats[persona]
            stats.count += 1

            # Generate actions for this persona
            actions = self.generate_actions_for_persona(persona)

            # Add appropriate user agent
            user_agent = self.get_user_agent(persona)
            for action in actions:
                if action.headers is None:
                    action.headers = {}
                action.headers["User-Agent"] = user_agent

            # Execute all actions
            for action in actions:
                result = await self.execute_request(session, action)

                # Update statistics
                stats.total_requests += 1
                stats.response_times.append(result.response_time)
                stats.status_codes[result.status] += 1

                if result.error:
                    stats.errors.append(f"{result.url}: {result.error}")

                # Track broken links
                if result.status >= 400 and result.status < 600:
                    self.broken_links.append((result.url, result.status))

                # Track page metrics
                self.page_metrics[result.url].append(result.response_time)

                # Check security headers on sample
                if random.random() > 0.95:  # 5% sample
                    has_csp = "content-security-policy" in result.headers
                    has_xframe = "x-frame-options" in result.headers
                    self.security_header_checks.append(has_csp or has_xframe)

                # Store result
                self.all_results.append(result)

                # Small delay between requests (except for bots)
                if persona != "crawler/bot":
                    await asyncio.sleep(random.uniform(0.1, 0.5))
                else:
                    await asyncio.sleep(random.uniform(0.01, 0.1))

    async def run_simulations(self):
        """Run all user simulations"""
        print(f"\n{'='*80}")
        print(f"Starting User Simulation: {self.total_simulations:,} users @ {self.concurrency} concurrent")
        print(f"Target: {self.BASE_URL}")
        print(f"{'='*80}\n")

        self.start_time = time.time()

        # Create aiohttp session with connection pooling
        connector = aiohttp.TCPConnector(limit=self.concurrency * 2)
        timeout = aiohttp.ClientTimeout(total=30)

        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            # Create all simulation tasks
            tasks = [
                self.simulate_user_session(session, i)
                for i in range(self.total_simulations)
            ]

            # Execute with progress tracking
            if HAS_TQDM:
                await tqdm.gather(*tasks, desc="Simulating users")
            else:
                # Simple progress without tqdm
                completed = 0
                total = len(tasks)

                for coro in asyncio.as_completed(tasks):
                    await coro
                    completed += 1
                    if completed % 100 == 0 or completed == total:
                        print(f"Progress: {completed}/{total} ({100*completed/total:.1f}%)")

        self.end_time = time.time()

    def calculate_percentile(self, values: List[float], percentile: float) -> float:
        """Calculate percentile from list of values"""
        if not values:
            return 0.0
        sorted_values = sorted(values)
        index = int(len(sorted_values) * percentile)
        return sorted_values[min(index, len(sorted_values) - 1)]

    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive report"""
        total_time = self.end_time - self.start_time
        all_response_times = [r.response_time for r in self.all_results if r.response_time > 0]

        # Overall status code distribution
        overall_status_codes = defaultdict(int)
        for result in self.all_results:
            overall_status_codes[result.status] += 1

        # Calculate per-page metrics
        page_stats = {}
        for path, times in self.page_metrics.items():
            errors = sum(1 for r in self.all_results if r.url == path and r.status >= 400)
            page_stats[path] = {
                "requests": len(times),
                "avg_response_time": sum(times) / len(times) if times else 0,
                "p95_response_time": self.calculate_percentile(times, 0.95),
                "error_rate": errors / len(times) if times else 0
            }

        # Top 10 slowest pages
        slowest_pages = sorted(
            page_stats.items(),
            key=lambda x: x[1]["avg_response_time"],
            reverse=True
        )[:10]

        # Find 5xx errors
        server_errors = [
            {"url": r.url, "status": r.status, "error": r.error}
            for r in self.all_results
            if r.status >= 500
        ]

        # Persona statistics
        persona_report = {}
        for persona, stats in self.persona_stats.items():
            persona_report[persona] = {
                "user_count": stats.count,
                "total_requests": stats.total_requests,
                "avg_requests_per_user": stats.total_requests / stats.count if stats.count > 0 else 0,
                "avg_response_time": sum(stats.response_times) / len(stats.response_times) if stats.response_times else 0,
                "p95_response_time": self.calculate_percentile(stats.response_times, 0.95),
                "status_codes": dict(stats.status_codes),
                "error_count": len(stats.errors),
                "sample_errors": stats.errors[:5]  # First 5 errors
            }

        report = {
            "simulation_metadata": {
                "total_simulations": self.total_simulations,
                "total_requests": len(self.all_results),
                "concurrency": self.concurrency,
                "duration_seconds": total_time,
                "requests_per_second": len(self.all_results) / total_time if total_time > 0 else 0,
                "timestamp": datetime.now().isoformat()
            },
            "persona_distribution": persona_report,
            "response_time_percentiles": {
                "p50": self.calculate_percentile(all_response_times, 0.50),
                "p95": self.calculate_percentile(all_response_times, 0.95),
                "p99": self.calculate_percentile(all_response_times, 0.99),
                "min": min(all_response_times) if all_response_times else 0,
                "max": max(all_response_times) if all_response_times else 0,
                "avg": sum(all_response_times) / len(all_response_times) if all_response_times else 0
            },
            "status_code_distribution": dict(overall_status_codes),
            "errors_and_broken_links": {
                "total_broken_links": len(self.broken_links),
                "unique_broken_links": len(set(url for url, _ in self.broken_links)),
                "broken_links_sample": self.broken_links[:20],  # First 20
                "server_errors_5xx": server_errors
            },
            "security_headers": {
                "checks_performed": len(self.security_header_checks),
                "compliant_count": sum(self.security_header_checks),
                "compliance_rate": sum(self.security_header_checks) / len(self.security_header_checks) if self.security_header_checks else 0
            },
            "page_metrics": page_stats,
            "slowest_pages": [
                {"path": path, **stats}
                for path, stats in slowest_pages
            ]
        }

        return report

    def print_summary(self, report: Dict[str, Any]):
        """Print human-readable summary"""
        meta = report["simulation_metadata"]
        perf = report["response_time_percentiles"]

        print(f"\n{'='*80}")
        print(f"SIMULATION COMPLETE")
        print(f"{'='*80}\n")

        print(f"Total Users:      {meta['total_simulations']:,}")
        print(f"Total Requests:   {meta['total_requests']:,}")
        print(f"Duration:         {meta['duration_seconds']:.2f}s")
        print(f"Requests/sec:     {meta['requests_per_second']:.2f}")
        print(f"Concurrency:      {meta['concurrency']}\n")

        print(f"{'='*80}")
        print(f"RESPONSE TIMES")
        print(f"{'='*80}\n")
        print(f"Min:              {perf['min']*1000:.2f}ms")
        print(f"Average:          {perf['avg']*1000:.2f}ms")
        print(f"p50 (median):     {perf['p50']*1000:.2f}ms")
        print(f"p95:              {perf['p95']*1000:.2f}ms")
        print(f"p99:              {perf['p99']*1000:.2f}ms")
        print(f"Max:              {perf['max']*1000:.2f}ms\n")

        print(f"{'='*80}")
        print(f"STATUS CODES")
        print(f"{'='*80}\n")
        for status, count in sorted(report["status_code_distribution"].items()):
            pct = 100 * count / meta['total_requests']
            print(f"{status}: {count:,} ({pct:.2f}%)")
        print()

        print(f"{'='*80}")
        print(f"PERSONA DISTRIBUTION")
        print(f"{'='*80}\n")
        for persona, stats in report["persona_distribution"].items():
            print(f"{persona:15} {stats['user_count']:,} users ({100*stats['user_count']/meta['total_simulations']:.1f}%) - "
                  f"{stats['total_requests']:,} requests - "
                  f"avg {stats['avg_response_time']*1000:.0f}ms")
        print()

        if report["errors_and_broken_links"]["server_errors_5xx"]:
            print(f"{'='*80}")
            print(f"SERVER ERRORS (5xx)")
            print(f"{'='*80}\n")
            for err in report["errors_and_broken_links"]["server_errors_5xx"][:10]:
                print(f"{err['status']} {err['url']} - {err.get('error', 'N/A')}")
            print()

        print(f"{'='*80}")
        print(f"TOP 10 SLOWEST PAGES")
        print(f"{'='*80}\n")
        for item in report["slowest_pages"]:
            print(f"{item['path']:40} {item['avg_response_time']*1000:6.0f}ms avg, "
                  f"{item['p95_response_time']*1000:6.0f}ms p95, "
                  f"{item['requests']:4} requests")
        print()

        security = report["security_headers"]
        if security["checks_performed"] > 0:
            print(f"{'='*80}")
            print(f"SECURITY HEADERS")
            print(f"{'='*80}\n")
            print(f"Compliance Rate:  {security['compliance_rate']*100:.1f}% "
                  f"({security['compliant_count']}/{security['checks_performed']} checks)\n")

        print(f"{'='*80}")
        print(f"Full report saved to: simulation-report.json")
        print(f"{'='*80}\n")

    async def run(self):
        """Main entry point"""
        await self.run_simulations()
        report = self.generate_report()

        # Save report
        report_path = "/Users/Shared/Scripts/HTML-Sites/simpletool-app/cloudflare-worker/scripts/simulation-report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        # Print summary
        self.print_summary(report)


async def main():
    """Main execution"""
    simulator = UserSimulator(total_simulations=15000, concurrency=50)
    await simulator.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nSimulation interrupted by user")
        sys.exit(1)
