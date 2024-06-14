# @jsonatax/jsonata-extended

A lightly modified [jsonata](https://github.com/jsonata-js/jsonata) fork package to support JSONataX functionality.

The version tracks the version in the underlying repository. For example, `@jsonatax/jsonata-extended@2.0.5` is the extended version of `jsonata@2.0.5`.

Whilst primarily serving as a bridge to JSONataX, `@jsonatax/jsonata-extended` can be used as a swap in replacement to `jsonata`, independent of the wider JSONataX library -- _with some rare exceptions_. See [Modifications](#modifications) for the advantages of doing so.

## Modifications

The principle of this module is to make the least amount of changes possible to the JSONata core to support JSONataX, to make long-term maintenance of this fork easier.

-   Conversion to an ESM module, with additional exports of core primitives necessary for JSONataX function.
-   Allow the AST to be provided to `evaluate` as well as the query string. This supports JSONAataX hooks that enable modification of the AST.
-   Changes to the parser AST such that nodes can be traced back to their originating query syntax. This supports enhanced JSONataX debug-ability features.
-   Protect pre-existing `__evaluate_entry` and `__evaluate_exit` hooks from being modified inside a query. Otherwise, this potentially allows malicious queries to disable functionality such as timeboxing.
-   Add a new `__frame_create` hook that is called when a new frame (aka environment) is created. This supports JSONataX core plugins that provide enhanced debug-ability and security to queries.
-   Changes to the core evaluator logic that allow expression execution to be more easily traced.

## Development

The development process is largely the same as that of [jsonata-js/jsonata](https://github.com/jsonata-js/jsonata), with some exceptions.

### Sync with latest JSONata

To bring the package up to the latest version of JSOnata, run:

```bash
pnpm run jsonata:pull
```

## FAQ

### Why can't these changes be part of JSONata core?

I have raised some of these changes in the JSOnata repository and the ideal outcome remains that they are merged and `@jsonatax/jsonata-extended` could be subsequently deprecated. However, I wish to move quicker than the current JSOnata project (which is an established long-lived project) allows, so it makes sense to maintain this for now. This will be kept under review.

Regardless, changes here are kept to a minimum to make merging upstream a realistic prospect.

### How can I verify the changes against [jsonata-js/jsonata](https://github.com/jsonata-js/jsonata)?

We use [git-subrepo](https://github.com/ingydotnet/git-subrepo) to track the upstream changes. This involves bringing in all the commits on [jsonata-js/jsonata](https://github.com/jsonata-js/jsonata) into this project.

### Can't I just use the canonical `jsonata` package with JSONataX instead?

Not yet, but we may add a way to do this with limited JSONataX functionality in future.

### What versions are available?

There are forks for every release `>= 2.0.5`. Less than this will not be supported due to critical security patches in this release that are assumed to exist.
