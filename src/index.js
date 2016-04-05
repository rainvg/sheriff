var fs = require('fs');
var ps = require('ps-node');

function __command__(pid)
{
  'use strict';

  pid = pid || process.pid.toString();

  return new Promise(function(resolve)
  {
    ps.lookup({pid: pid}, function(error, procs)
    {
      var command = '';

      procs.forEach(function(proc)
      {
        if(proc.pid === pid)
          command = proc.command;
      });

      resolve(command);
    });
  });
}

function __lockable__(path)
{
  'use strict';
  
  return new Promise(function(resolve)
  {
    fs.readFile(path, function(error, pid)
    {
      if(error)
        resolve(true);
      else
      {
        __command__().then(function(local)
        {
          __command__(pid).then(function(remote)
          {
            if(local === remote)
              resolve(false);
            else
              resolve(true);
          });
        });
      }
    });
  });
}

function lock(path)
{
  'use strict';

  return new Promise(function(resolve, reject)
  {
    __lockable__(path).then(function(lockable)
    {
      if(lockable)
      {
        fs.writeFile(path, process.pid.toString(), function(error)
        {
          if(error)
            reject();
          else
            resolve();
        });
      }
      else
        reject();
    });
  });
}

module.exports = {
  lock: lock
};
